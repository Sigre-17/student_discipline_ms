import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { api, API_BASE_URL } from './src/api/client';

interface UserSession {
  token: string;
  user: {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
  };
}

interface IncidentItem {
  incident_id: number;
  incident_date: string;
  location: string;
  category_name: string;
  severity_level: string;
  description: string;
  status: string;
  reported_by_name?: string;
  involved_students_summary?: string;
}

interface CategoryItem {
  category_id: number;
  category_name: string;
  severity_level: string;
  demerit_points: number;
}

interface TestCredential {
  user_id: number;
  username: string;
  full_name: string;
  role: string;
  email?: string;
}

function formatTitle(text: string): string {
  if (!text) return '';
  return text
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Eye / Eye-off SVG-equivalent using View shapes
function EyeToggle({ visible, onPress }: { visible: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.eyeBtn} activeOpacity={0.6} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      {visible ? (
        // Eye open: circle with outline
        <View style={{ width: 20, height: 14, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 20, height: 14, borderRadius: 10, borderWidth: 1.8, borderColor: '#64748b' }} />
          <View style={{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#64748b' }} />
        </View>
      ) : (
        // Eye closed: oval with strike line
        <View style={{ width: 20, height: 14, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: 20, height: 14, borderRadius: 10, borderWidth: 1.8, borderColor: '#94a3b8' }} />
          <View style={{ position: 'absolute', width: 22, height: 1.8, backgroundColor: '#94a3b8', transform: [{ rotate: '-20deg' }] }} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// Clean Vector Icons (Zero external font dependencies, pixel-perfect on all screens)
function HomeIcon({ active }: { active: boolean }) {
  const color = active ? '#3b82f6' : '#64748b';
  return (
    <View style={iconStyles.box}>
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: 8,
          borderRightWidth: 8,
          borderBottomWidth: 6,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        }}
      />
      <View
        style={{
          width: 13,
          height: 9,
          backgroundColor: color,
          borderBottomLeftRadius: 2,
          borderBottomRightRadius: 2,
          alignItems: 'center',
          justifyContent: 'flex-end',
        }}
      >
        <View style={{ width: 4, height: 4.5, backgroundColor: active ? '#0f172a' : '#1e293b' }} />
      </View>
    </View>
  );
}

function IncidentsIcon({ active }: { active: boolean }) {
  const color = active ? '#3b82f6' : '#64748b';
  return (
    <View style={iconStyles.box}>
      <View
        style={{
          width: 16,
          height: 17,
          borderRadius: 3,
          borderWidth: 1.6,
          borderColor: color,
          padding: 2.5,
          justifyContent: 'space-around',
        }}
      >
        <View style={{ height: 1.6, width: 8, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ height: 1.6, width: 6, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ height: 1.6, width: 8, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function ReportIcon({ active }: { active: boolean }) {
  const color = active ? '#3b82f6' : '#64748b';
  return (
    <View style={iconStyles.box}>
      <View
        style={{
          width: 19,
          height: 19,
          borderRadius: 9.5,
          borderWidth: 1.6,
          borderColor: color,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={{ position: 'absolute', width: 9, height: 1.6, backgroundColor: color, borderRadius: 1 }} />
        <View style={{ position: 'absolute', width: 1.6, height: 9, backgroundColor: color, borderRadius: 1 }} />
      </View>
    </View>
  );
}

function RecordsIcon({ active }: { active: boolean }) {
  const color = active ? '#3b82f6' : '#64748b';
  return (
    <View style={[iconStyles.box, { flexDirection: 'row', alignItems: 'flex-end', gap: 2.5, paddingBottom: 2 }]}>
      <View style={{ width: 3.5, height: 8, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 3.5, height: 15, backgroundColor: color, borderRadius: 1 }} />
      <View style={{ width: 3.5, height: 11, backgroundColor: color, borderRadius: 1 }} />
    </View>
  );
}

const iconStyles = StyleSheet.create({
  box: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [credentials, setCredentials] = useState<TestCredential[]>([]);

  // 4 Bottom Pages: 'home' | 'incidents' | 'report' | 'records'
  const [activeTab, setActiveTab] = useState<'home' | 'incidents' | 'report' | 'records'>('home');

  // Core Data
  const [tables, setTables] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [incidents, setIncidents] = useState<IncidentItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [dashLoading, setDashLoading] = useState(false);

  // Search & Filter in Incidents
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'All' | 'Grave' | 'Serious' | 'Moderate' | 'Minor'>('All');

  // Quick Report Form
  const [reportCategory, setReportCategory] = useState<string>('1');
  const [reportLocation, setReportLocation] = useState('');
  const [reportDesc, setReportDesc] = useState('');
  const [reportDate, setReportDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Dynamic navigation detection (Gesture vs 3-Button system navigation)
  const [detectedNavType, setDetectedNavType] = useState<'gesture' | '3-button'>('gesture');
  const [navBarOffset, setNavBarOffset] = useState<number>(0);
  const [navModeOverride, setNavModeOverride] = useState<'auto' | 'gesture' | '3-button'>('auto');

  useEffect(() => {
    function calculateNavMetrics() {
      if (Platform.OS === 'android') {
        const screenH = Dimensions.get('screen').height;
        const windowH = Dimensions.get('window').height;
        const statusBarH = StatusBar.currentHeight || 0;
        const bottomDiff = Math.round(screenH - windowH - statusBarH);

        // Standard Android 3-button navigation takes ~48dp (range 24-60dp)
        // Gesture navigation is 0dp or thin (< 24dp)
        if (bottomDiff >= 24) {
          setDetectedNavType('3-button');
          setNavBarOffset(Math.max(bottomDiff, 32));
        } else {
          setDetectedNavType('gesture');
          setNavBarOffset(0);
        }
      } else {
        setDetectedNavType('gesture');
        setNavBarOffset(Platform.OS === 'ios' ? 14 : 0);
      }
    }

    calculateNavMetrics();
    const subscription = Dimensions.addEventListener('change', calculateNavMetrics);
    return () => {
      subscription?.remove?.();
    };
  }, []);

  const activeNavType = navModeOverride === 'auto' ? detectedNavType : navModeOverride;
  const isThreeButton = activeNavType === '3-button';
  const bottomExtraPadding = isThreeButton ? (navBarOffset > 0 ? navBarOffset : 32) : (Platform.OS === 'ios' ? 14 : 6);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ username: identifier, password });
      setSession(data);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  function loadDashboardData() {
    setDashLoading(true);
    Promise.all([api.getTables(), api.getSeedStatus(), api.getIncidents(), api.getCategories()])
      .then(([tableData, statusData, incData, catData]) => {
        setTables(tableData.tables || []);
        setCounts(statusData.counts || {});
        setIncidents(incData.incidents || []);
        setCategories(catData.categories || []);
      })
      .catch((err: any) => {
        setError(err.message || 'Failed to load dashboard data.');
      })
      .finally(() => setDashLoading(false));
  }

  useEffect(() => {
    if (session) {
      loadDashboardData();
    }
  }, [session]);

  async function handleQuickReport() {
    if (!reportLocation.trim()) {
      Alert.alert('Required Field', 'Please enter the incident location.');
      return;
    }
    if (!reportDesc.trim()) {
      Alert.alert('Required Field', 'Please provide a factual narrative of the incident.');
      return;
    }

    setReportSubmitting(true);
    setReportSuccess('');
    try {
      await api.reportIncident({
        category_id: reportCategory || '1',
        incident_date: reportDate,
        location: reportLocation.trim(),
        description: reportDesc.trim(),
      });
      setReportSuccess('Incident successfully recorded and queued for disciplinary hearing.');
      setReportLocation('');
      setReportDesc('');
      const incData = await api.getIncidents();
      setIncidents(incData.incidents || []);
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Failed to record incident.');
    } finally {
      setReportSubmitting(false);
    }
  }

  // Filtered incidents
  const filteredIncidents = incidents.filter((inc) => {
    if (severityFilter !== 'All' && inc.severity_level !== severityFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCat = inc.category_name?.toLowerCase().includes(q);
      const matchDesc = inc.description?.toLowerCase().includes(q);
      const matchLoc = inc.location?.toLowerCase().includes(q);
      const matchStd = inc.involved_students_summary?.toLowerCase().includes(q);
      if (!matchCat && !matchDesc && !matchLoc && !matchStd) return false;
    }
    return true;
  });

  if (!session) {
    return (
      <SafeAreaView style={styles.loginContainer}>
        <ExpoStatusBar style="light" />
        <ScrollView contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.brandBox}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>SDMS</Text>
            </View>
            <Text style={styles.brandTitle}>Student Discipline MS</Text>
            <Text style={styles.brandSubtitle}>Staff Mobile Access Portal</Text>
          </View>

          <View style={styles.loginCard}>
            <Text style={styles.cardHeading}>Staff Authentication</Text>
            <Text style={styles.cardSub}>Sign in with your institutional credentials to continue.</Text>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.inputLabel}>Email, Username, or Student Number</Text>
            <TextInput
              style={styles.textInput}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              placeholder="e.g. adong.grace, email, or student/staff no"
              placeholderTextColor="#94a3b8"
            />

            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
              />
              <EyeToggle visible={showPassword} onPress={() => setShowPassword((v) => !v)} />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />

      {/* Top Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>SDMS Mobile</Text>
          <Text style={styles.headerSubtitle}>
            {session.user.full_name} · {session.user.role}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.navModeBadge}
          onPress={() => {
            setNavModeOverride((prev) => (prev === 'gesture' ? '3-button' : prev === '3-button' ? 'auto' : 'gesture'));
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.navModeText}>
            {isThreeButton ? '3-Button Nav ▲' : 'Gesture Nav ▼'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => setSession(null)}
          activeOpacity={0.7}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area — flex: 1 with bounded ScrollView so bottom nav is always visible */}
      <View style={styles.contentArea}>
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.mainScroll} keyboardShouldPersistTaps="handled">
          {dashLoading ? (
            <ActivityIndicator size="large" color="#1e40af" style={{ marginTop: 40 }} />
          ) : activeTab === 'home' ? (
            /* PAGE 1: HOME */
            <>
              <View style={styles.termCard}>
                <Text style={styles.termEyebrow}>Academic Session 2026</Text>
                <Text style={styles.termTitle}>Term 3 Conduct Governance</Text>
                <Text style={styles.termStatus}>Active PostgreSQL Database Connected · 17 Tables Verified</Text>
              </View>

              <Text style={styles.sectionHeader}>Conduct Overview</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Learners</Text>
                  <Text style={styles.metricVal}>{counts.students ?? 0}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Total Incidents</Text>
                  <Text style={styles.metricVal}>{counts.incidents ?? 0}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Teaching Staff</Text>
                  <Text style={styles.metricVal}>{counts.staff ?? 0}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Audit Events</Text>
                  <Text style={styles.metricVal}>{counts.audit_log ?? 0}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Quick Actions</Text>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionButtonPrimary}
                  onPress={() => setActiveTab('report')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonPrimaryText}>+ Report New Infraction</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButtonSecondary}
                  onPress={() => setActiveTab('incidents')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.actionButtonSecondaryText}>Incident Register</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.sectionHeader}>Recent Conduct Activity</Text>
              {incidents.slice(0, 3).map((inc) => (
                <View key={inc.incident_id} style={styles.recentItemCard}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.incidentDate}>{inc.incident_date}</Text>
                    <Text style={styles.recentItemSev}>{inc.severity_level}</Text>
                  </View>
                  <Text style={styles.recentItemCat}>{inc.category_name}</Text>
                  <Text style={styles.recentItemLoc}>Location: {inc.location}</Text>
                </View>
              ))}

              <TouchableOpacity
                style={styles.viewAllBtn}
                onPress={() => setActiveTab('incidents')}
                activeOpacity={0.7}
              >
                <Text style={styles.viewAllBtnText}>View All ({incidents.length}) Recorded Incidents</Text>
              </TouchableOpacity>
            </>
          ) : activeTab === 'incidents' ? (
            /* PAGE 2: INCIDENTS */
            <>
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search incident, location, student..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <View style={styles.filterChipRow}>
                {(['All', 'Grave', 'Serious', 'Moderate', 'Minor'] as const).map((sev) => (
                  <TouchableOpacity
                    key={sev}
                    style={[styles.filterChip, severityFilter === sev && styles.filterChipActive]}
                    onPress={() => setSeverityFilter(sev)}
                  >
                    <Text style={[styles.filterChipText, severityFilter === sev && styles.filterChipTextActive]}>
                      {sev}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filteredIncidents.map((inc) => {
                const isGrave = inc.severity_level === 'Grave';
                const isSerious = inc.severity_level === 'Serious';
                const isModerate = inc.severity_level === 'Moderate';

                return (
                  <View key={inc.incident_id} style={styles.incidentCard}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={styles.incidentDate}>{inc.incident_date}</Text>
                      <View
                        style={[
                          styles.severityPill,
                          isGrave
                            ? styles.pillGrave
                            : isSerious
                            ? styles.pillSerious
                            : isModerate
                            ? styles.pillModerate
                            : styles.pillMinor,
                        ]}
                      >
                        <Text
                          style={[
                            styles.severityPillText,
                            isGrave
                              ? styles.pillTextGrave
                              : isSerious
                              ? styles.pillTextSerious
                              : isModerate
                              ? styles.pillTextModerate
                              : styles.pillTextMinor,
                          ]}
                        >
                          {inc.severity_level}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.categoryTitle}>{inc.category_name}</Text>
                    <Text style={styles.descriptionText}>{inc.description}</Text>

                    {inc.involved_students_summary ? (
                      <View style={styles.studentBadge}>
                        <Text style={styles.studentBadgeLabel}>Learners Involved:</Text>
                        <Text style={styles.studentBadgeValue}>{inc.involved_students_summary}</Text>
                      </View>
                    ) : null}

                    <View style={styles.cardFooterRow}>
                      <Text style={styles.metaLabel}>Location: {inc.location}</Text>
                      <View style={styles.statusBadge}>
                        <Text style={styles.statusText}>{inc.status}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}

              {filteredIncidents.length === 0 && (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No matching incidents found</Text>
                  <Text style={styles.emptySubtitle}>Adjust your search query or severity filter above.</Text>
                </View>
              )}
            </>
          ) : activeTab === 'report' ? (
            /* PAGE 3: REPORT */
            <View style={styles.reportFormCard}>
              <Text style={styles.formTitle}>Record Conduct Infraction</Text>
              <Text style={styles.formSubtitle}>
                Direct report from staff on duty. Infraction will be queued for hearing and determination.
              </Text>

              {reportSuccess ? (
                <View style={styles.successBanner}>
                  <Text style={styles.successText}>{reportSuccess}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Incident Date</Text>
              <TextInput
                style={styles.textInput}
                value={reportDate}
                onChangeText={setReportDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.inputLabel}>Offence Category</Text>
              <View style={styles.categoryChips}>
                {categories.map((c) => (
                  <TouchableOpacity
                    key={c.category_id}
                    style={[
                      styles.catChip,
                      String(reportCategory) === String(c.category_id) && styles.catChipActive,
                    ]}
                    onPress={() => setReportCategory(String(c.category_id))}
                  >
                    <Text
                      style={[
                        styles.catChipText,
                        String(reportCategory) === String(c.category_id) && styles.catChipTextActive,
                      ]}
                    >
                      {c.category_name} ({c.severity_level})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.inputLabel}>Location *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Science Lab, Main Quad, Dining Hall"
                placeholderTextColor="#94a3b8"
                value={reportLocation}
                onChangeText={setReportLocation}
              />

              <Text style={styles.inputLabel}>Incident Description & Observations *</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Describe factual events, persons involved, and immediate intervention taken..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                value={reportDesc}
                onChangeText={setReportDesc}
              />

              <TouchableOpacity
                style={[styles.primaryButton, reportSubmitting && styles.buttonDisabled]}
                onPress={handleQuickReport}
                disabled={reportSubmitting}
                activeOpacity={0.8}
              >
                {reportSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.primaryButtonText}>Submit Incident Report</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* PAGE 4: RECORDS & DATABASE */
            <>
              <Text style={styles.sectionHeader}>Institutional Records</Text>
              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Sanctions Issued</Text>
                  <Text style={styles.metricVal}>{counts.sanctions ?? 0}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Suspensions</Text>
                  <Text style={styles.metricVal}>{counts.suspensions ?? 0}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Counselling Files</Text>
                  <Text style={styles.metricVal}>{counts.counselling_sessions ?? 0}</Text>
                </View>
                <View style={styles.metricCard}>
                  <Text style={styles.metricLabel}>Merit Awards</Text>
                  <Text style={styles.metricVal}>{counts.merits ?? 0}</Text>
                </View>
              </View>

              <Text style={styles.sectionHeader}>Database Verification ({tables.length} tables)</Text>
              <View style={styles.tableCard}>
                {tables.map((tbl) => (
                  <View key={tbl} style={styles.tableRow}>
                    <Text style={styles.tableName}>{formatTitle(tbl)}</Text>
                    <Text style={styles.tableCount}>
                      {counts[tbl] !== undefined ? `${counts[tbl]} rows` : 'Active'}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Backend REST Service:</Text>
                <Text style={styles.infoUrl}>{API_BASE_URL}</Text>
              </View>
            </>
          )}
        </ScrollView>

        {/* 4 BOTTOM NAVIGATION TABS */}
        <View
          style={[
            styles.bottomNav,
            {
              paddingBottom: bottomExtraPadding,
              minHeight: 58 + bottomExtraPadding,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveTab('home')}
            activeOpacity={0.7}
          >
            <HomeIcon active={activeTab === 'home'} />
            <Text style={[styles.navTabLabel, activeTab === 'home' && styles.navTabLabelActive]}>
              Home
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveTab('incidents')}
            activeOpacity={0.7}
          >
            <IncidentsIcon active={activeTab === 'incidents'} />
            <Text style={[styles.navTabLabel, activeTab === 'incidents' && styles.navTabLabelActive]}>
              Incidents
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveTab('report')}
            activeOpacity={0.7}
          >
            <ReportIcon active={activeTab === 'report'} />
            <Text style={[styles.navTabLabel, activeTab === 'report' && styles.navTabLabelActive]}>
              Report
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navTab}
            onPress={() => setActiveTab('records')}
            activeOpacity={0.7}
          >
            <RecordsIcon active={activeTab === 'records'} />
            <Text style={[styles.navTabLabel, activeTab === 'records' && styles.navTabLabelActive]}>
              Records
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loginScroll: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandBox: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e40af',
    borderWidth: 1,
    borderColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandBadgeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    letterSpacing: 1,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  loginCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardSub: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 5,
    marginTop: 10,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 14,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#1e40af',
    borderRadius: 6,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 18,
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 12.5,
  },
  successBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    color: '#166534',
    fontSize: 12.5,
    fontWeight: '600',
  },
  demoSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  demoSectionTitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  demoStaffItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  demoStaffName: {
    fontSize: 12.5,
    color: '#0f172a',
    fontWeight: '500',
  },
  demoRoleTag: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  demoRoleText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },

  // Main Dashboard Styles
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  navModeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  navModeText: {
    color: '#93c5fd',
    fontSize: 11,
    fontWeight: '600',
  },
  signOutButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#1e293b',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  signOutText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '500',
  },

  contentArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollArea: {
    flex: 1,
  },

  mainScroll: {
    padding: 16,
    paddingBottom: 20,
  },

  // Page 1: Home Styles
  termCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderLeftWidth: 4,
    borderLeftColor: '#1e40af',
  },
  termEyebrow: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#1e40af',
    textTransform: 'uppercase',
  },
  termTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  termStatus: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  actionButtonPrimary: {
    flex: 1,
    backgroundColor: '#1e40af',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionButtonPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  actionButtonSecondary: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  actionButtonSecondaryText: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  recentItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  recentItemSev: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1e40af',
  },
  recentItemCat: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 2,
  },
  recentItemLoc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  viewAllBtnText: {
    color: '#1e40af',
    fontSize: 13,
    fontWeight: '600',
  },

  // Page 2: Incidents Styles
  searchContainer: {
    marginBottom: 10,
  },
  searchInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
  },

  filterChipRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  filterChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#1e40af',
    borderColor: '#1e40af',
  },
  filterChipText: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },

  incidentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  incidentDate: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  severityPill: {
    paddingVertical: 2,
    paddingHorizontal: 7,
    borderRadius: 4,
    borderWidth: 1,
  },
  pillGrave: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  pillSerious: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
  pillModerate: { backgroundColor: '#fefce8', borderColor: '#fef08a' },
  pillMinor: { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' },
  severityPillText: { fontSize: 11, fontWeight: '600' },
  pillTextGrave: { color: '#991b1b' },
  pillTextSerious: { color: '#b45309' },
  pillTextModerate: { color: '#854d0e' },
  pillTextMinor: { color: '#0369a1' },

  categoryTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
    marginBottom: 8,
  },
  studentBadge: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 5,
    marginBottom: 8,
  },
  studentBadgeLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  studentBadgeValue: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
    marginTop: 2,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  metaLabel: {
    fontSize: 11.5,
    color: '#64748b',
  },
  statusBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusText: {
    fontSize: 11,
    color: '#334155',
    fontWeight: '600',
  },

  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },

  // Page 3: Report Form Styles
  reportFormCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  formSubtitle: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14,
    lineHeight: 17,
  },
  categoryChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catChipActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  catChipText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
  },
  catChipTextActive: {
    color: '#1e40af',
    fontWeight: '600',
  },

  // Page 4: Records Tab Styles
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#ffffff',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  metricVal: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 4,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableName: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#0f172a',
  },
  tableCount: {
    fontSize: 12,
    color: '#64748b',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  infoUrl: {
    fontSize: 11.5,
    color: '#1e40af',
    marginTop: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },

  // 4 Bottom Navigation Bar Styles
  bottomNav: {
    minHeight: 58,
    backgroundColor: '#0f172a',
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },

  // Password row with eye toggle
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 6,
    marginBottom: 0,
  },

  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  navTabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  navTabLabelActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
});
