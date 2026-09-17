import React, { useState, useEffect, Suspense, lazy } from 'react';
import { UserProfile, PetProfile, MedicalRecord } from './types';
import { initialUsers, initialPets } from './data/initialData';
import { api } from './services/api';
import { supabase } from './services/supabaseClient';

import { Sidebar } from './components/common/Sidebar';

import { LoginModal } from './components/common/LoginModal';
import { SuspendedAccountModal } from './components/common/SuspendedAccountModal';
import { NotificationProvider } from './contexts/NotificationContext';
import { NotFoundView } from './components/common/NotFoundView';

import { lazyWithRetry } from './utils/lazyWithRetry';

// Lazy-loaded User Views with auto-retry on new deployments
const PetChatView = lazyWithRetry(() => import('./components/user/PetChatView').then(m => ({ default: m.PetChatView })));
const MedicalHistoryView = lazyWithRetry(() => import('./components/user/MedicalHistoryView').then(m => ({ default: m.MedicalHistoryView })));
const MedicalRecordDetailView = lazyWithRetry(() => import('./components/user/MedicalRecordDetailView').then(m => ({ default: m.MedicalRecordDetailView })));
const ArticlesNewsView = lazyWithRetry(() => import('./components/user/ArticlesNewsView').then(m => ({ default: m.ArticlesNewsView })));
const EmergencyFirstAidView = lazyWithRetry(() => import('./components/user/EmergencyFirstAidView').then(m => ({ default: m.EmergencyFirstAidView })));
const NearestClinicsView = lazyWithRetry(() => import('./components/user/NearestClinicsView').then(m => ({ default: m.NearestClinicsView })));
const PetManagementView = lazyWithRetry(() => import('./components/user/PetManagementView').then(m => ({ default: m.PetManagementView })));
const AccountSettingsView = lazyWithRetry(() => import('./components/user/AccountSettingsView').then(m => ({ default: m.AccountSettingsView })));

// Lazy-loaded Admin Views with auto-retry on new deployments
const AdminDashboardView = lazyWithRetry(() => import('./components/admin/AdminDashboardView').then(m => ({ default: m.AdminDashboardView })));
const AdminUsersView = lazyWithRetry(() => import('./components/admin/AdminUsersView').then(m => ({ default: m.AdminUsersView })));
const AdminPetsRecordsView = lazyWithRetry(() => import('./components/admin/AdminPetsRecordsView').then(m => ({ default: m.AdminPetsRecordsView })));
const AdminClinicsView = lazyWithRetry(() => import('./components/admin/AdminClinicsView').then(m => ({ default: m.AdminClinicsView })));
const AdminKnowledgeRAGView = lazyWithRetry(() => import('./components/admin/AdminKnowledgeRAGView').then(m => ({ default: m.AdminKnowledgeRAGView })));
const AdminSystemConfigView = lazyWithRetry(() => import('./components/admin/AdminSystemConfigView').then(m => ({ default: m.AdminSystemConfigView })));
const AdminHealthCheckView  = lazyWithRetry(() => import('./components/admin/AdminHealthCheckView').then(m => ({ default: m.AdminHealthCheckView })));
const AdminLogView          = lazyWithRetry(() => import('./components/admin/AdminLogView').then(m => ({ default: m.AdminLogView })));

// Loading spinner fallback for lazy-loaded components
function PageLoader() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <span className="text-sm text-slate-500 font-medium">Đang tải...</span>
      </div>
    </div>
  );
}

const guestUser: UserProfile = {
  id: 'guest',
  name: 'Khách',
  email: '',
  avatar: 'https://ui-avatars.com/api/?name=Guest&background=random',
  role: 'user',
  status: 'active',
  createdAt: new Date().toISOString()
};

export function App() {
  const validTabs = ['chat', 'records', 'record_detail', 'news', 'emergency', 'clinics', 'pets', 'account', 'admin_dashboard', 'admin_users', 'admin_records', 'admin_clinics', 'admin_rag', 'admin_config', 'admin_health', 'not_found'];
  
  const getInitialTab = () => {
    const path = window.location.pathname.substring(1);
    if (!path) return 'chat';
    return validTabs.includes(path) ? path : 'not_found';
  };

  const [currentUser, setCurrentUser] = useState<UserProfile>(guestUser);
  const [currentTab, setCurrentTab] = useState<string>(getInitialTab());
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  
  // Sync tab with URL (including query parameters for record_detail)
  useEffect(() => {
    // Do not interfere if Supabase is processing an OAuth redirect
    if (window.location.hash && window.location.hash.includes('access_token')) {
      return;
    }

    let currentPath = `/${currentTab}`;
    if (currentTab === 'record_detail' && selectedRecord) {
      currentPath += `?id=${selectedRecord.id}`;
    }
    if (window.location.pathname + window.location.search !== currentPath) {
      window.history.pushState(null, '', currentPath);
    }
  }, [currentTab, selectedRecord]);

  // Load record from URL query param if present
  useEffect(() => {
    const loadRecordFromUrl = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const recordId = searchParams.get('id');
      if (currentTab === 'record_detail' && recordId) {
        try {
          const rec = await api.getMedicalRecordById(recordId);
          setSelectedRecord(rec);
        } catch (err) {
          console.error('Failed to load record from URL:', err);
          setCurrentTab('records');
        }
      }
    };
    loadRecordFromUrl();
  }, [currentTab]);

  // Handle back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.substring(1);
      if (!path) setCurrentTab('chat');
      else setCurrentTab(validTabs.includes(path) ? path : 'not_found');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // PWA Install Prompt Logic
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPrompt = e; // make it accessible globally for AccountSettingsView
      
      const hasDismissed = localStorage.getItem('petcare_pwa_dismissed');
      // If not dismissed and not already installed (standalone mode)
      if (!hasDismissed && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowPwaBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPwaBanner(false);
      localStorage.setItem('petcare_pwa_dismissed', 'true');
    }
    setDeferredPrompt(null);
    (window as any).deferredPrompt = null;
  };

  const handleDismissPwa = () => {
    setShowPwaBanner(false);
    localStorage.setItem('petcare_pwa_dismissed', 'true');
  };

  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState<boolean>(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState<boolean>(true);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      setIsDesktopSidebarOpen(prev => !prev);
    } else {
      setIsOpenMobileSidebar(prev => !prev);
    }
  };

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [selectedPet, setSelectedPet] = useState<PetProfile | null>(null);

  // Load pets when user changes
  const refreshPets = async () => {
    try {
      const userPets = await api.getPets(currentUser.id);
      setPets(userPets);
      if (userPets.length > 0 && !selectedPet) {
        setSelectedPet(userPets[0]);
      }
    } catch (e) {
      console.error('Error refreshing pets:', e);
    }
  };

  const handleUpdateUser = (updates: Partial<UserProfile>) => {
    setCurrentUser(prev => ({ ...prev, ...updates }));
    // Ideally, we would also call an API to update this on the backend
    // api.updateUser(currentUser.id, updates);
  };

  useEffect(() => {
    refreshPets();
  }, [currentUser.id]);

  // Handle Supabase Auth State
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await syncAndSetUser(session.user);
        } else {
          setIsAuthLoading(false);
        }
      } catch (e) {
        console.error(e);
        setIsAuthLoading(false);
      }
    };
    
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setIsAuthLoading(true);
        await syncAndSetUser(session.user);
        setIsLoginModalOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(guestUser);
        setPets([]);
        setSelectedPet(null);
        setIsAuthLoading(false);
        
        // If guest is on a protected route, redirect to chat
        const currentPath = window.location.pathname.substring(1);
        if (currentPath.startsWith('admin_') || ['account', 'pets', 'records'].includes(currentPath)) {
          setCurrentTab('chat');
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const syncAndSetUser = async (authUser: any) => {
    try {
      const payload = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
        avatar: authUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${authUser.email}`
      };
      const syncedUser = await api.syncGoogleUser(payload);
      setCurrentUser(syncedUser);
      
      const currentPath = window.location.pathname.substring(1);
      const isAdminRoute = currentPath.startsWith('admin_');
      
      if (syncedUser.role !== 'admin' && isAdminRoute) {
        // Kick non-admins out of admin routes
        setCurrentTab('chat');
      } else if (window.location.pathname === '/' || window.location.pathname === '/chat') {
        // Default landing page based on role
        if (syncedUser.role === 'admin') {
          setCurrentTab('admin_dashboard');
        } else {
          setCurrentTab('chat');
        }
      }
    } catch (e) {
      console.error('Error syncing user:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <NotificationProvider>
      <div className="h-screen h-dvh w-screen overflow-hidden bg-slate-100/70 text-slate-900 font-sans flex antialiased selection:bg-emerald-200">
        {/* App Shell */}
        <div className="flex w-full h-full overflow-hidden">
          {/* Left Sidebar Navigation */}
          <Sidebar
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            currentUser={currentUser}
            onOpenLoginModal={() => setIsLoginModalOpen(true)}
            isOpenMobile={isOpenMobileSidebar}
            onCloseMobile={() => setIsOpenMobileSidebar(false)}
            isDesktopOpen={isDesktopSidebarOpen}
            onToggleDesktop={() => setIsDesktopSidebarOpen(prev => !prev)}
          />




          {/* Mobile open sidebar button */}
          <button
            onClick={() => setIsOpenMobileSidebar(true)}
            className="lg:hidden fixed top-3 left-3 z-40 w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-700 flex items-center justify-center border border-slate-200/60 shadow-xs transition-all cursor-pointer"
            title="Mở Menu"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </button>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <main
            className={`flex-1 min-h-0 w-full mx-auto ${
              currentTab === 'chat'
                ? 'flex flex-col overflow-hidden pt-0'
                : 'overflow-y-auto p-3 sm:p-6 max-w-7xl pt-14 lg:pt-6'
            }`}
          >
            <Suspense fallback={<PageLoader />}>
            {/* User Navigation Views */}
            {currentTab === 'chat' && (
              <PetChatView
                pets={pets}
                selectedPet={selectedPet}
                setSelectedPet={setSelectedPet}
                onNavigateToRecords={() => setCurrentTab('records')}
                onNavigateToPets={() => setCurrentTab('pets')}
                currentUser={currentUser}
                onOpenLogin={() => setIsLoginModalOpen(true)}
              />
            )}

            {currentTab === 'records' && (
              <MedicalHistoryView
                pets={pets}
                currentUser={currentUser}
                onViewRecordDetail={(record) => {
                  setSelectedRecord(record);
                  setCurrentTab('record_detail');
                }}
              />
            )}

            {currentTab === 'record_detail' && (
              selectedRecord ? (
                <MedicalRecordDetailView
                  record={selectedRecord}
                  onBack={() => setCurrentTab('records')}
                  onDelete={async (id) => {
                    if (window.confirm('Bạn có chắc chắn muốn xóa vĩnh viễn hồ sơ bệnh án này?')) {
                      try {
                        await api.deleteMedicalRecord(id);
                        setCurrentTab('records');
                      } catch (e) {
                        console.error(e);
                      }
                    }
                  }}
                />
              ) : (
                <PageLoader />
              )
            )}

            {currentTab === 'news' && (
              <ArticlesNewsView />
            )}

            {currentTab === 'emergency' && (
              <EmergencyFirstAidView />
            )}

            {currentTab === 'clinics' && (
              <NearestClinicsView />
            )}

            {currentTab === 'pets' && (
              <PetManagementView
                pets={pets}
                currentUser={currentUser}
                onRefreshPets={refreshPets}
              />
            )}

            {currentTab === 'account' && (
              <AccountSettingsView 
                currentUser={currentUser} 
                onUpdateUser={handleUpdateUser}
              />
            )}

            {/* Admin Navigation Views */}
            {currentUser.role === 'admin' && (
              <>
                {currentTab === 'admin_dashboard' && <AdminDashboardView />}
                {currentTab === 'admin_users'     && <AdminUsersView currentUser={currentUser} />}
                {currentTab === 'admin_records'   && <AdminPetsRecordsView />}
                {currentTab === 'admin_clinics'   && <AdminClinicsView />}
                {currentTab === 'admin_rag'       && <AdminKnowledgeRAGView />}
                {currentTab === 'admin_config'    && <AdminSystemConfigView />}
                {currentTab === 'admin_health'    && <AdminHealthCheckView />}
                {currentTab === 'admin_logs'      && <AdminLogView />}
              </>
            )}

            {currentTab === 'not_found' && <NotFoundView />}
            </Suspense>
          </main>
          </div>
        </div>
      </div>

      {/* Google Login & Role Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Suspended Account Overlay Modal */}
      {currentUser.status === 'suspended' && (
        <SuspendedAccountModal
          currentUser={currentUser}
          onLogoutAndSwitch={async () => {
            await supabase.auth.signOut();
            setIsLoginModalOpen(true);
          }}
        />
      )}

      {/* PWA Install Banner */}
      {showPwaBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 flex flex-col gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-start gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-800">Cài đặt PetCare AI</h3>
              <p className="text-xs text-slate-500 mt-0.5">Thêm ứng dụng vào màn hình chính để trải nghiệm mượt mà hơn và truy cập nhanh.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={handleDismissPwa}
              className="flex-1 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Để sau
            </button>
            <button
              onClick={handleInstallPwa}
              className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
            >
              Cài đặt ngay
            </button>
          </div>
        </div>
      )}
    </NotificationProvider>
  );
}

export default App;
