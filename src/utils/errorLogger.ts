import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const logAppError = async (errorMessage: string, errorStack?: string, component?: string) => {
  try {
    // Avoid logging failures to submit errors recursively
    if (errorMessage.includes('/support/error-logs')) return;

    // Retrieve active user context from localStorage if available
    let userId = undefined;
    let username = undefined;
    try {
      const activeUser = localStorage.getItem('active_user') || localStorage.getItem('user');
      if (activeUser) {
        const user = JSON.parse(activeUser);
        userId = user.id;
        username = user.username;
      }
    } catch (e) {
      console.warn("Failed to parse user details for diagnostic logging", e);
    }

    // Resolve tenant context
    let tenantId = undefined;
    const activeTenantId = localStorage.getItem('active_tenant_id');
    if (activeTenantId && activeTenantId !== 'main') {
      tenantId = parseInt(activeTenantId);
    }

    await axios.post(`${API_URL}/support/error-logs`, {
      tenant_id: tenantId,
      user_id: userId,
      username: username || 'invitado',
      error_message: errorMessage,
      error_stack: errorStack || 'N/A',
      component: component || 'Frontend Client',
      url: window.location.href,
      user_agent: navigator.userAgent
    });
  } catch (e) {
    console.error('Fatal: Failed to report runtime exception to diagnostic backend', e);
  }
};
