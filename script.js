      function showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        const target = document.getElementById(screenId);
        if (!target) return;

        screens.forEach((screen) => {
          screen.classList.toggle('active', screen.id === screenId);
        });

        if (screenId === 'dashboard-screen') {
          setSessionState(true);
          if (typeof renderDashboardBalance === 'function') renderDashboardBalance();
        } else if (screenId === 'login-screen') {
          setSessionState(false);
        }
      }

      function setSessionState(isAuthenticated) {
        sessionStorage.setItem('oppay_session_active', isAuthenticated ? 'true' : 'false');
      }

      function restoreSessionState() {
        // Start a fresh app visit at login; authentication is retained only during this page session.
        sessionStorage.removeItem('oppay_session_active');
        if (document.getElementById('login-screen')) {
          showScreen('login-screen');
        }
        return false;
      }

      document.addEventListener('DOMContentLoaded', () => {
        initUserStorage();
        restoreSessionState();
        const pinBackBtn = document.getElementById('pin-back-btn');
        if (pinBackBtn) {
          pinBackBtn.addEventListener('click', () => {
            if (sessionStorage.getItem('oppay_session_active') === 'true') {
              showScreen('dashboard-screen');
            } else {
              setSessionState(false);
              showScreen('login-screen');
            }
          });
        }
      });

      function initUserStorage() {
        const usernameInput = document.getElementById('usernameInput');
        const rawSavedUser = localStorage.getItem('oppay_username') || localStorage.getItem('oppay_current_user') || localStorage.getItem('oppay_user_fullname');
        const savedUser = (!rawSavedUser || rawSavedUser.trim() === '' || rawSavedUser === 'John' || rawSavedUser === 'John Doe')
          ? 'Bernadeth Deloso'
          : rawSavedUser;

        localStorage.setItem('oppay_username', savedUser);
        localStorage.setItem('oppay_current_user', savedUser);
        localStorage.setItem('oppay_user_fullname', savedUser);

        if (usernameInput) usernameInput.value = savedUser;
        updateSyncPreviews(savedUser);
      }

      function saveUserState(username) {
        const trimmed = username.trim() || 'Bernadeth Deloso';

        localStorage.setItem('oppay_current_user', trimmed);
        localStorage.setItem('oppay_username', trimmed);
        localStorage.setItem('oppay_user_fullname', trimmed);
        localStorage.setItem('oppay_last_login', new Date().toISOString());

        const syncEvent = new CustomEvent('oppay_user_updated', {
          detail: {
            username: trimmed,
            timestamp: Date.now()
          }
        });
        window.dispatchEvent(syncEvent);

        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'OPPAY_AUTH_SYNC', username: trimmed }, '*');
        }

        updateSyncPreviews(trimmed);
        return trimmed;
      }

      function updateSyncPreviews(username) {
        const name = username || 'Bernadeth Deloso';
        const pDashboard = document.getElementById('previewDashboard');
        const pProfile = document.getElementById('previewProfile');
        const pSettings = document.getElementById('previewSettings');
        const greetingEl = document.getElementById('userNameDisplay');
        const pillEl = document.getElementById('active-user-pill');

        if (pDashboard) pDashboard.innerText = `Welcome back, ${name}`;
        if (pProfile) pProfile.innerText = name;
        if (pSettings) pSettings.innerText = `Signed in as ${name}`;
        if (greetingEl) greetingEl.textContent = getShortName(name);
        if (pillEl) pillEl.textContent = getShortName(name);

        document.querySelectorAll('.user-short-name').forEach((el) => {
          el.textContent = getShortName(name);
        });
      }

      function getShortName(fullName) {
        if (!fullName) return 'User';
        const trimmed = fullName.trim();
        const parts = trimmed.split(/\s+/);
        return parts[0] || trimmed;
      }

      function handleAuthSubmit(event) {
        if (event) event.preventDefault();
        const usernameInput = document.getElementById('usernameInput');
        const username = (usernameInput ? usernameInput.value : 'Bernadeth Deloso').trim() || 'Bernadeth Deloso';

        saveUserState(username);
        setSessionState(false);
        showToast(`Logged in as ${username} — Synced to Dashboard, Profile & Settings`);
        showScreen('pin-screen');
      }

      function handleBiometricLogin(method) {
        const usernameInput = document.getElementById('usernameInput');
        const username = (usernameInput ? usernameInput.value : 'Bernadeth Deloso').trim() || 'Bernadeth Deloso';
        saveUserState(username);
        setSessionState(false);
        showToast(`${method} verified for ${username} — Synced across system`);
        showScreen('pin-screen');
      }

      let toastTimeout;
      function showToast(text) {
        const toast = document.getElementById('syncToast');
        const toastMessage = document.getElementById('toastMessage');
        if (toast && toastMessage) {
          toastMessage.innerText = text;
          toast.classList.remove('opacity-0', 'pointer-events-none', '-translate-y-20');
          toast.classList.add('opacity-100', 'translate-y-0');

          clearTimeout(toastTimeout);
          toastTimeout = setTimeout(() => {
            hideToast();
          }, 4000);
        }
      }

      function hideToast() {
        const toast = document.getElementById('syncToast');
        if (toast) {
          toast.classList.add('opacity-0', 'pointer-events-none', '-translate-y-20');
          toast.classList.remove('opacity-100', 'translate-y-0');
        }
      }

      function openSyncPreviewModal() {
        const username = document.getElementById('usernameInput').value || 'Bernadeth Deloso';
        updateSyncPreviews(username);
        const modal = document.getElementById('syncModal');
        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100');
      }

      function closeSyncPreviewModal() {
        const modal = document.getElementById('syncModal');
        modal.classList.add('opacity-0', 'pointer-events-none');
        modal.classList.remove('opacity-100');
      }

      function switchAuthTab(mode) {
        const loginTab = document.getElementById('tab-login');
        const signupTab = document.getElementById('tab-signup');
        const fullnameField = document.getElementById('field-fullname');
        const forgotLink = document.getElementById('link-forgot');
        const submitText = document.getElementById('btn-submit-text');

        if (mode === 'signup') {
          signupTab.className = 'flex-1 py-2.5 rounded-full font-label-lg text-label-lg transition-all duration-200 bg-primary-container text-white shadow-md flex items-center justify-center gap-1.5';
          loginTab.className = 'flex-1 py-2.5 rounded-full font-label-lg text-label-lg transition-all duration-200 text-on-surface-variant hover:text-primary flex items-center justify-center gap-1.5';
          fullnameField.classList.remove('hidden');
          fullnameField.classList.add('flex');
          forgotLink.classList.add('hidden');
          submitText.innerText = 'Agree & Create Account';
        } else {
          loginTab.className = 'flex-1 py-2.5 rounded-full font-label-lg text-label-lg transition-all duration-200 bg-primary-container text-white shadow-md flex items-center justify-center gap-1.5';
          signupTab.className = 'flex-1 py-2.5 rounded-full font-label-lg text-label-lg transition-all duration-200 text-on-surface-variant hover:text-primary flex items-center justify-center gap-1.5';
          fullnameField.classList.add('hidden');
          fullnameField.classList.remove('flex');
          forgotLink.classList.remove('hidden');
          submitText.innerText = 'Continue to Secure PIN';
        }
      }

      function togglePasswordVisibility() {
        const passwordInput = document.getElementById('input-password');
        const eyeIcon = document.getElementById('eye-icon');
        if (passwordInput.type === 'password') {
          passwordInput.type = 'text';
          eyeIcon.innerText = 'visibility_off';
        } else {
          passwordInput.type = 'password';
          eyeIcon.innerText = 'visibility';
        }
      }

      (function () {
        const USER_STORAGE_KEYS = ['oppay_current_user', 'oppay_username', 'oppay_user_fullname'];
        const DEFAULT_NAME = 'Bernadeth Deloso';

        function getStoredUsername() {
          for (const key of USER_STORAGE_KEYS) {
            const val = localStorage.getItem(key);
            if (val && val.trim().length > 0) {
              try {
                const parsed = JSON.parse(val);
                if (typeof parsed === 'string') return parsed === 'John' || parsed === 'John Doe' ? DEFAULT_NAME : parsed;
                if (parsed.name) return parsed.name === 'John' || parsed.name === 'John Doe' ? DEFAULT_NAME : parsed.name;
                if (parsed.username) return parsed.username === 'John' || parsed.username === 'John Doe' ? DEFAULT_NAME : parsed.username;
                if (parsed.fullName) return parsed.fullName === 'John' || parsed.fullName === 'John Doe' ? DEFAULT_NAME : parsed.fullName;
              } catch (e) {
                const clean = val.trim();
                return clean === 'John' || clean === 'John Doe' ? DEFAULT_NAME : clean;
              }
            }
          }
          return DEFAULT_NAME;
        }

        function getShortName(fullName) {
          if (!fullName) return 'User';
          const trimmed = fullName.trim();
          const parts = trimmed.split(/\s+/);
          return parts[0] || trimmed;
        }

        function applyUserGreeting() {
          const fullName = getStoredUsername();
          const shortName = getShortName(fullName);
          const greetingEl = document.getElementById('userNameDisplay');
          const pillEl = document.getElementById('active-user-pill');

          if (greetingEl) greetingEl.textContent = shortName;
          if (pillEl) pillEl.textContent = shortName;

          document.querySelectorAll('.user-short-name').forEach((el) => {
            el.textContent = shortName;
          });

          const syncInput = document.getElementById('sync-name-input');
          if (syncInput) syncInput.value = fullName;
        }

        function setStoredUsername(newName) {
          if (!newName || !newName.trim()) return;
          const cleanName = newName.trim();
          localStorage.setItem('oppay_current_user', cleanName);
          localStorage.setItem('oppay_username', cleanName);
          localStorage.setItem('oppay_user_fullname', cleanName);
          applyUserGreeting();
        }

        applyUserGreeting();

        window.addEventListener('storage', (event) => {
          if (USER_STORAGE_KEYS.includes(event.key)) {
            applyUserGreeting();
          }
        });

        const modal = document.getElementById('user-sync-modal');
        const triggerBtn = document.getElementById('demo-user-trigger');
        const closeBtn = document.getElementById('close-sync-modal');
        const saveBtn = document.getElementById('sync-save-btn');
        const inputEl = document.getElementById('sync-name-input');
        const switchAccountBtn = document.getElementById('switch-account-btn');

        if (triggerBtn && modal) {
          triggerBtn.addEventListener('click', () => {
            modal.classList.toggle('hidden');
            if (!modal.classList.contains('hidden') && inputEl) inputEl.focus();
          });
        }

        if (switchAccountBtn && modal) {
          switchAccountBtn.addEventListener('click', () => {
            modal.classList.remove('hidden');
            if (inputEl) inputEl.focus();
          });
        }

        if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.add('hidden'));

        if (saveBtn && inputEl && modal) {
          saveBtn.addEventListener('click', () => {
            if (inputEl.value.trim()) {
              setStoredUsername(inputEl.value.trim());
              modal.classList.add('hidden');
            }
          });

          inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
              setStoredUsername(inputEl.value.trim());
              modal.classList.add('hidden');
            }
          });
        }

        document.querySelectorAll('.preset-btn').forEach((btn) => {
          btn.addEventListener('click', () => {
            const name = btn.getAttribute('data-name');
            if (name) {
              setStoredUsername(name);
              if (modal) modal.classList.add('hidden');
            }
          });
        });

        let pinCode = '';
        const maxPinLength = 6;
        const dots = document.querySelectorAll('.pin-dot');
        const statusMsg = document.getElementById('status-message');

        function updateDots() {
          dots.forEach((dot, index) => {
            if (index < pinCode.length) {
              dot.classList.remove('border-outline-variant', 'bg-surface-container-lowest');
              dot.classList.add('border-secondary-container', 'bg-primary-container', 'scale-110', 'shadow-[0_0_10px_rgba(253,190,80,0.6)]');
            } else {
              dot.classList.add('border-outline-variant', 'bg-surface-container-lowest');
              dot.classList.remove('border-secondary-container', 'bg-primary-container', 'scale-110', 'shadow-[0_0_10px_rgba(253,190,80,0.6)]');
            }
          });

          if (pinCode.length === maxPinLength) {
            if (statusMsg) {
              statusMsg.textContent = 'Verifying security credential...';
              statusMsg.classList.remove('opacity-0');
              statusMsg.classList.add('text-secondary');
            }
            setTimeout(() => {
              const currentName = getShortName(getStoredUsername());
              if (statusMsg) {
                statusMsg.textContent = `Welcome, ${currentName}! Verified.`;
                statusMsg.classList.replace('text-secondary', 'text-primary');
              }
              setTimeout(() => {
                setSessionState(true);
                pinCode = '';
                updateDots();
                if (statusMsg) statusMsg.classList.add('opacity-0');
                showScreen('dashboard-screen');
              }, 1200);
            }, 800);
          } else if (statusMsg) {
            statusMsg.classList.add('opacity-0');
          }
        }

        document.querySelectorAll('.num-key').forEach((button) => {
          button.addEventListener('click', () => {
            if (pinCode.length < maxPinLength) {
              pinCode += button.getAttribute('data-value');
              updateDots();
            }
          });
        });

        const deleteBtn = document.getElementById('delete-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', () => {
            if (pinCode.length > 0) {
              pinCode = pinCode.slice(0, -1);
              updateDots();
            }
          });
        }

        const biometricBtn = document.getElementById('biometric-btn');
        if (biometricBtn) {
          biometricBtn.addEventListener('click', () => {
            if (statusMsg) {
              statusMsg.textContent = 'Scanning Biometric Sensor...';
              statusMsg.classList.remove('opacity-0');
              statusMsg.classList.add('text-secondary');
            }
            setTimeout(() => {
              pinCode = '123456';
              updateDots();
            }, 600);
          });
        }

        function bindDashboardActions() {
          const dashboardActions = {
            deposit: () => {
              showScreen('cashin-screen');
            },
            transfer: () => {
              showScreen('transfer-screen');
              if (window.refreshTransferScreen) window.refreshTransferScreen();
            },
            scan: () => {
              showScreen('scan-screen');
              if (window.refreshScannerState) window.refreshScannerState();
            },
            loans: () => {
              if (window.showToast) {
                showToast('Loan application opened.');
              }
            },
            'buy-load': () => {
              showScreen('bills-screen');
              setTimeout(() => window.billsOpenCategory?.('load'), 180);
            },
            'pay-bills': () => {
              showScreen('bills-screen');
            },
            savings: () => {
              if (window.showToast) {
                showToast('Savings account opened.');
              }
            },
            more: () => {
              if (window.showToast) {
                showToast('More services opened.');
              }
            },
            promo: () => {
              if (window.showToast) {
                showToast('Special promo details opened.');
              }
            },
            notifications: () => {
              if (window.showToast) {
                showToast('You have 3 new notifications.');
              }
            },
            'copy-account': () => {
              if (window.showToast) showToast('Account ending in 8842 is ready to copy.');
            },
            settings: () => {
              showScreen('settings-screen');
              if (window.refreshSettingsScreen) window.refreshSettingsScreen();
            }
          };

          document.querySelectorAll('[data-action]').forEach((button) => {
            button.onclick = () => {
              const action = button.getAttribute('data-action');
              if (dashboardActions[action]) {
                dashboardActions[action]();
              }
            };
          });

          document.querySelectorAll('.dashboard-nav-btn').forEach((button) => {
            button.onclick = () => {
              document.querySelectorAll('.dashboard-nav-btn').forEach((nav) => {
                nav.classList.remove('bg-primary-container', 'text-secondary-fixed', 'shadow-sm');
                nav.classList.add('text-on-surface-variant');
                const icon = nav.querySelector('.material-symbols-outlined');
                const label = nav.querySelector('span:last-child');
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
                if (label) {
                  label.classList.remove('font-semibold');
                  label.classList.add('font-medium');
                }
              });
              button.classList.remove('text-on-surface-variant');
              button.classList.add('bg-primary-container', 'text-secondary-fixed', 'shadow-sm');
              const icon = button.querySelector('.material-symbols-outlined');
              const label = button.querySelector('span:last-child');
              if (icon) icon.style.fontVariationSettings = "'FILL' 1";
              if (label) {
                label.classList.remove('font-medium');
                label.classList.add('font-semibold');
              }
              const nav = button.getAttribute('data-nav');
              if (nav === 'pay') {
                showScreen('bills-screen');
                return;
              }
              if (nav === 'cards') {
                showScreen('cards-screen');
                if (window.refreshCardsScreen) window.refreshCardsScreen();
                return;
              }
              if (nav === 'settings') {
                showScreen('settings-screen');
                if (window.refreshSettingsScreen) window.refreshSettingsScreen();
                return;
              }
              if (nav === 'history') {
                if (window.transferHistory) window.transferHistory();
                else if (window.showToast) showToast('Transaction history opened.');
                return;
              }
              if (nav && nav !== 'home' && window.showToast) {
                const navMessages = { pay: 'Pay options opened.', cards: 'Your cards are ready.', history: 'Transaction history opened.', settings: 'Settings opened.' };
                showToast(navMessages[nav] || 'Section opened.');
              }
            };
          });

          const toggleBalanceBtn = document.getElementById('toggleBalanceBtn');
          if (toggleBalanceBtn) toggleBalanceBtn.addEventListener('click', toggleDashboardBalance);

          const quickActionBtns = document.querySelectorAll('#quickActionsGrid .quick-action-btn');
          quickActionBtns.forEach((button) => {
            button.addEventListener('click', () => {
              quickActionBtns.forEach((item) => {
                const circle = item.querySelector('.action-icon-circle');
                const label = item.querySelector('.action-label');
                const icon = item.querySelector('.material-symbols-outlined');
                if (circle) {
                  circle.classList.remove('bg-[#F5B041]', 'text-[#330057]', 'ring-2', 'ring-secondary-fixed', 'shadow-md');
                  circle.classList.add('bg-primary-container', 'text-secondary-fixed', 'shadow-sm');
                }
                if (label) {
                  label.classList.remove('font-bold');
                  label.classList.add('font-semibold');
                }
                if (icon) icon.style.fontVariationSettings = "'FILL' 0";
              });

              const activeCircle = button.querySelector('.action-icon-circle');
              const activeLabel = button.querySelector('.action-label');
              const activeIcon = button.querySelector('.material-symbols-outlined');
              if (activeCircle) {
                activeCircle.classList.remove('bg-primary-container', 'text-secondary-fixed', 'shadow-sm');
                activeCircle.classList.add('bg-[#F5B041]', 'text-[#330057]', 'ring-2', 'ring-secondary-fixed', 'shadow-md');
              }
              if (activeLabel) {
                activeLabel.classList.remove('font-semibold');
                activeLabel.classList.add('font-bold');
              }
              if (activeIcon) activeIcon.style.fontVariationSettings = "'FILL' 1";
            });
          });

          renderDashboardBalance();
        }

        window.addEventListener('DOMContentLoaded', bindDashboardActions);
      })();
    

