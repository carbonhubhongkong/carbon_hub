// Session Manager for ESG Platform Data Retention
// This utility manages user sessions and implements automatic data cleanup

import toast from "react-hot-toast";

interface SessionData {
  sessionId: string;
  lastActivity: number;
  isModalOpen: boolean;
  modalStartTime?: number;
}

class SessionManager {
  private sessionId: string;
  private inactivityTimer: NodeJS.Timeout | null = null;
  private modalTimer: NodeJS.Timeout | null = null;
  private onInactivityWarning: (() => void) | null = null;
  private onDataCleanup: (() => void) | null = null;

  // CONFIGURATION: Change these values to adjust timing
  private readonly INACTIVITY_TIMEOUT = 20 * 60 * 1000; // 20 minutes in milliseconds
  private readonly MODAL_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeSession();
    this.setupActivityListeners();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeSession(): void {
    const existingSession = localStorage.getItem("carbonHubSession");
    if (existingSession) {
      try {
        const sessionData: SessionData = JSON.parse(existingSession);
        // Check if session is still valid (within 24 hours)
        if (Date.now() - sessionData.lastActivity < 24 * 60 * 60 * 1000) {
          this.sessionId = sessionData.sessionId;
          this.updateActivity();
        } else {
          this.createNewSession();
        }
      } catch {
        this.createNewSession();
      }
    } else {
      this.createNewSession();
    }
  }

  private createNewSession(): void {
    const sessionData: SessionData = {
      sessionId: this.sessionId,
      lastActivity: Date.now(),
      isModalOpen: false,
    };
    localStorage.setItem("carbonHubSession", JSON.stringify(sessionData));
  }

  private setupActivityListeners(): void {
    // Track user activity events
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    activityEvents.forEach((event) => {
      document.addEventListener(event, () => this.updateActivity(), {
        passive: true,
      });
    });

    // Track form interactions
    document.addEventListener("input", () => this.updateActivity(), {
      passive: true,
    });
    document.addEventListener("change", () => this.updateActivity(), {
      passive: true,
    });
  }

  public updateActivity(): void {
    const sessionData = this.getSessionData();
    sessionData.lastActivity = Date.now();
    sessionData.isModalOpen = false;
    sessionData.modalStartTime = undefined;
    this.saveSessionData(sessionData);

    // Reset timers
    this.resetInactivityTimer();
    this.clearModalTimer();
  }

  private resetInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }

    this.inactivityTimer = setTimeout(() => {
      this.showInactivityWarning();
    }, this.INACTIVITY_TIMEOUT);
  }

  private showInactivityWarning(): void {
    const sessionData = this.getSessionData();
    sessionData.isModalOpen = true;
    sessionData.modalStartTime = Date.now();
    this.saveSessionData(sessionData);

    if (this.onInactivityWarning) {
      this.onInactivityWarning();
    }

    // Start modal timer
    this.modalTimer = setTimeout(() => {
      this.cleanupData();
    }, this.MODAL_TIMEOUT);
  }

  public extendSession(): void {
    this.updateActivity();
    toast.success(
      "Session extended! Your data is safe for another 20 minutes."
    );
  }

  public cleanupData(): void {
    if (this.onDataCleanup) {
      this.onDataCleanup();
    }

    // Clear session
    localStorage.removeItem("carbonHubSession");
    this.createNewSession();

    toast.success("All data has been cleared due to inactivity.");
  }

  private clearModalTimer(): void {
    if (this.modalTimer) {
      clearTimeout(this.modalTimer);
      this.modalTimer = null;
    }
  }

  private getSessionData(): SessionData {
    const sessionData = localStorage.getItem("carbonHubSession");
    if (sessionData) {
      return JSON.parse(sessionData);
    }
    return {
      sessionId: this.sessionId,
      lastActivity: Date.now(),
      isModalOpen: false,
    };
  }

  private saveSessionData(sessionData: SessionData): void {
    localStorage.setItem("carbonHubSession", JSON.stringify(sessionData));
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public isModalOpen(): boolean {
    const sessionData = this.getSessionData();
    return sessionData.isModalOpen || false;
  }

  public getModalTimeRemaining(): number {
    const sessionData = this.getSessionData();
    if (!sessionData.modalStartTime) return 0;

    const elapsed = Date.now() - sessionData.modalStartTime;
    return Math.max(0, this.MODAL_TIMEOUT - elapsed);
  }

  public setInactivityWarningCallback(callback: () => void): void {
    this.onInactivityWarning = callback;
  }

  public setDataCleanupCallback(callback: () => void): void {
    this.onDataCleanup = callback;
  }

  public destroy(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
    }
    if (this.modalTimer) {
      clearTimeout(this.modalTimer);
    }
  }
}

export default SessionManager;
