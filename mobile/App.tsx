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
  Alert,
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

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [username, setUsername] = useState('adong.grace');
  const [password, setPassword] = useState('Grace@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dashboard Data
  const [tables, setTables] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [dashLoading, setDashLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      const data = await api.login({ username, password });
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
      Promise.all([api.getTables(), api.getSeedStatus()])
        .then(([tableData, statusData]) => {
          setTables(tableData.tables || []);
          setCounts(statusData.counts || {});
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
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Sign In to Workspace</Text>
              )}
            </TouchableOpacity>

            <View style={styles.demoBox}>
              <Text style={styles.demoTitle}>Demo Credentials:</Text>
              <Text style={styles.demoText}>
                User: <Text style={styles.bold}>adong.grace</Text> | Pass:{' '}
                <Text style={styles.bold}>Grace@123</Text>
              </Text>
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
          <Text style={styles.headerTitle}>SDMS Dashboard</Text>
          <Text style={styles.headerUser}>
            {session.user.full_name} ({session.user.role})
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setSession(null)}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.dashboardContent}>
        {dashLoading ? (
          <ActivityIndicator size="large" color="#c87845" style={{ marginTop: 40 }} />
        ) : (
          <>
            <Text style={styles.sectionTitle}>Conduct Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Students</Text>
                <Text style={styles.metricVal}>{counts.students ?? '—'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Staff</Text>
                <Text style={styles.metricVal}>{counts.staff ?? '—'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Incidents</Text>
                <Text style={styles.metricVal}>{counts.incidents ?? '—'}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Audit Events</Text>
                <Text style={styles.metricVal}>{counts.audit_log ?? '—'}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Database Status ({tables.length} tables)</Text>
            <View style={styles.tableListCard}>
              {tables.map((tbl) => (
                <View key={tbl} style={styles.tableRow}>
                  <Text style={styles.tableName}>{tbl}</Text>
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
    marginBottom: 30,
  },
  brandLogo: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#f2b880',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    fontSize: 14,
    color: '#8eafbe',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
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
    marginBottom: 20,
    marginTop: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#496170',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#F4F8F9',
    borderWidth: 1,
    borderColor: '#CBDBE0',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#102a43',
  },
  button: {
    backgroundColor: '#c87845',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorBox: {
    backgroundColor: '#FFF0ED',
    borderWidth: 1,
    borderColor: '#F8B4A6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  errorText: {
    color: '#9E3D34',
    fontSize: 13,
  },
  demoBox: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5EDEF',
  },
  demoTitle: {
    fontSize: 12,
    color: '#6b8290',
    fontWeight: '600',
  },
  demoText: {
    fontSize: 12,
    color: '#496170',
    marginTop: 2,
  },
  bold: {
    fontWeight: 'bold',
    color: '#102a43',
  },

  // Dashboard Styles
  header: {
    backgroundColor: '#102a43',
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dashboardContent: {
    padding: 20,
    backgroundColor: '#EDF3F6',
    minHeight: '100%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#102a43',
    marginBottom: 12,
    marginTop: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#D9E4E8',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b8290',
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#102a43',
    marginTop: 6,
  },
  tableListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D9E4E8',
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F6',
  },
  tableName: {
    fontSize: 13,
    color: '#496170',
    fontWeight: '500',
  },
  tableCount: {
    fontSize: 13,
    color: '#102a43',
    fontWeight: 'bold',
  },
  apiInfoBox: {
    backgroundColor: '#102a43',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    marginBottom: 40,
  },
  apiInfoTitle: {
    fontSize: 11,
    color: '#8eafbe',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  apiInfoUrl: {
    fontSize: 13,
    color: '#f2b880',
    marginTop: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
