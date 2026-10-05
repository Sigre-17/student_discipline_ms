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

const DEMO_STAFF = [
  { username: 'adong.grace', label: 'Grace Adong (Head Teacher)' },
  { username: 'okello.david', label: 'David Okello (Discipline Master)' },
  { username: 'mugisha.brian', label: 'Brian Mugisha (Class Teacher)' },
  { username: 'atwine.sarah', label: 'Sarah Atwine (Counsellor)' },
];

function formatTitle(text: string): string {
  if (!text) return '';
  return text
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [username, setUsername] = useState('adong.grace');
  const [password, setPassword] = useState('Grace@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard Data
  const [activeTab, setActiveTab] = useState<'metrics' | 'incidents'>('metrics');
  const [tables, setTables] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [incidents, setIncidents] = useState<any[]>([]);
  const [dashLoading, setDashLoading] = useState(false);

  async function handleLogin(userParam?: string) {
    const userToLogin = userParam || username;
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ username: userToLogin, password });
      setSession(data);
    } catch (err: any) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (session) {
      setDashLoading(true);
      Promise.all([api.getTables(), api.getSeedStatus(), api.getIncidents()])
        .then(([tableData, statusData, incData]) => {
          setTables(tableData.tables || []);
          setCounts(statusData.counts || {});
          setIncidents(incData.incidents || []);
        })
        .catch((err: any) => {
          setError(err.message || 'Failed to load dashboard data.');
        })
        .finally(() => setDashLoading(false));
    }
  }, [session]);

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <ExpoStatusBar style="light" />
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.brandContainer}>
            <View style={styles.brandLogo}>
              <Text style={styles.brandLogoText}>S</Text>
            </View>
            <Text style={styles.brandTitle}>SDMS Mobile</Text>
            <Text style={styles.brandSubtitle}>Student Discipline Conduct Platform</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardHeader}>Staff Sign In</Text>
            <Text style={styles.cardSub}>Review incidents and discipline activity on mobile.</Text>

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Text style={styles.label}>Username</Text>
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Username"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={() => handleLogin()}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Quick Select Staff Account:</Text>
              {DEMO_STAFF.map((staff) => (
                <TouchableOpacity
                  key={staff.username}
                  style={styles.demoStaffBtn}
                  onPress={() => {
                    setUsername(staff.username);
                    setPassword('Grace@123');
                  }}
                >
                  <Text style={styles.demoStaffText}>{staff.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ExpoStatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>SDMS Mobile</Text>
          <Text style={styles.headerUser}>
            {session.user.full_name} ({session.user.role})
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setSession(null)}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      {/* Mobile Tab Switcher */}
      <View style={styles.mobileTabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'metrics' && styles.tabButtonActive]}
          onPress={() => setActiveTab('metrics')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'metrics' && styles.tabButtonTextActive]}>
            Metrics & Tables
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'incidents' && styles.tabButtonActive]}
          onPress={() => setActiveTab('incidents')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'incidents' && styles.tabButtonTextActive]}>
            Incidents Feed ({incidents.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.dashboardContent}>
        {dashLoading ? (
          <ActivityIndicator size="large" color="#c87845" style={{ marginTop: 40 }} />
        ) : activeTab === 'metrics' ? (
          <>
            <Text style={styles.sectionTitle}>Conduct Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Students</Text>
                <Text style={styles.metricVal}>{counts.students ?? 0}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Staff</Text>
                <Text style={styles.metricVal}>{counts.staff ?? 0}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Incidents</Text>
                <Text style={styles.metricVal}>{counts.incidents ?? 0}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Audit Events</Text>
                <Text style={styles.metricVal}>{counts.audit_log ?? 0}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Database Status ({tables.length} tables)</Text>
            <View style={styles.tableListCard}>
              {tables.map((tbl) => (
                <View key={tbl} style={styles.tableRow}>
                  <Text style={styles.tableName}>{formatTitle(tbl)}</Text>
                  <Text style={styles.tableCount}>
                    {counts[tbl] !== undefined ? `${counts[tbl]} rows` : 'Active'}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.apiInfoBox}>
              <Text style={styles.apiInfoTitle}>API Endpoint Connected:</Text>
              <Text style={styles.apiInfoUrl}>{API_BASE_URL}</Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.sectionTitle}>School Incidents Log</Text>
            {incidents.map((inc) => (
              <View key={inc.incident_id} style={styles.incidentCard}>
                <View style={styles.incidentHeader}>
                  <Text style={styles.incidentDate}>{inc.incident_date}</Text>
                  <View
                    style={[
                      styles.severityBadge,
                      inc.severity_level === 'Grave'
                        ? styles.badgeGrave
                        : inc.severity_level === 'Serious'
                        ? styles.badgeSerious
                        : styles.badgeMinor,
                    ]}
                  >
                    <Text style={styles.severityText}>{inc.severity_level}</Text>
                  </View>
                </View>
                <Text style={styles.incidentCategory}>{inc.category_name}</Text>
                <Text style={styles.incidentDesc}>{inc.description}</Text>
                <View style={styles.incidentFooter}>
                  <Text style={styles.incidentLocation}>📍 {inc.location}</Text>
                  <Text style={styles.incidentStatus}>{inc.status}</Text>
                </View>
                {inc.involved_students_summary ? (
                  <Text style={styles.incidentStudents}>
                    Learners: {inc.involved_students_summary}
                  </Text>
                ) : null}
              </View>
            ))}
            {incidents.length === 0 && (
              <Text style={styles.emptyText}>No incidents recorded yet.</Text>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#102a43',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f2b880',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandLogoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#102a43',
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#8eafbe',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  cardHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#102a43',
  },
  cardSub: {
    fontSize: 13,
    color: '#6b8290',
    marginBottom: 16,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#496170',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F4F8F9',
    borderWidth: 1,
    borderColor: '#CBDBE0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#102a43',
  },
  button: {
    backgroundColor: '#c87845',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#F8B4A6',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  errorText: {
    color: '#9E3D34',
    fontSize: 13,
  },
  demoBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5EDEF',
  },
  demoTitle: {
    fontSize: 12,
    color: '#6b8290',
    fontWeight: '700',
    marginBottom: 8,
  },
  demoStaffBtn: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#f4f8f9',
    borderRadius: 6,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#e2edf0',
  },
  demoStaffText: {
    fontSize: 12,
    color: '#102a43',
    fontWeight: '600',
  },

  // Dashboard Styles
  header: {
    backgroundColor: '#102a43',
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerUser: {
    fontSize: 12,
    color: '#8eafbe',
    marginTop: 2,
  },
  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 12,
  },

  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a1d30',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  tabButtonActive: {
    backgroundColor: '#173f63',
  },
  tabButtonText: {
    color: '#8eafbe',
    fontSize: 13,
    fontWeight: '600',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },

  dashboardContent: {
    padding: 16,
    backgroundColor: '#edf3f6',
    minHeight: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#102a43',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dbe5e8',
  },
  metricLabel: {
    fontSize: 12,
    color: '#597387',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#102a43',
    marginTop: 4,
  },
  tableListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe5e8',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f4f6',
  },
  tableName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#102a43',
  },
  tableCount: {
    fontSize: 12,
    color: '#597387',
  },

  // Incident Feed Cards
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#dbe5e8',
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  incidentDate: {
    fontSize: 12,
    color: '#597387',
    fontWeight: '600',
  },
  severityBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  badgeMinor: { backgroundColor: '#ebf8ff' },
  badgeSerious: { backgroundColor: '#feebc8' },
  badgeGrave: { backgroundColor: '#fed7d7' },
  severityText: { fontSize: 11, fontWeight: '700', color: '#102a43' },
  incidentCategory: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#102a43',
    marginBottom: 4,
  },
  incidentDesc: {
    fontSize: 13,
    color: '#334e68',
    lineHeight: 18,
    marginBottom: 8,
  },
  incidentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f4f6',
  },
  incidentLocation: { fontSize: 12, color: '#597387' },
  incidentStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#22543d',
    backgroundColor: '#c6f6d5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  incidentStudents: {
    fontSize: 11.5,
    color: '#c87845',
    marginTop: 6,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#8eafbe',
    marginTop: 30,
    fontSize: 14,
  },

  apiInfoBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#dbe5e8',
    marginBottom: 20,
  },
  apiInfoTitle: { fontSize: 12, color: '#597387', fontWeight: 'bold' },
  apiInfoUrl: { fontSize: 12, color: '#c87845', marginTop: 2, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
});
