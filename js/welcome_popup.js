// welcome_popup.js - Standalone welcome popup for first-time users

export class WelcomePopup {
    constructor(forceShow = false) {
        this.isVisible = false;
        this.container = null;
        this.hasBeenShown = forceShow ? false : this.checkIfShown();
        
        if (!this.hasBeenShown || forceShow) {
            this.init();
        }
    }
    
    /**
     * Check if welcome popup has been shown before
     */
    checkIfShown() {
        // Option 1: Show every time (comment out the sessionStorage line)
        return false;
        
        // Option 2: Show once per session (current behavior)
        // return sessionStorage.getItem('welcomeShown') === 'true';
        
        // Option 3: Show once ever (using localStorage)
        // return localStorage.getItem('welcomeShown') === 'true';
    }
    
    /**
     * Mark welcome popup as shown
     */
    markAsShown() {
        // Option 1: Don't mark as shown (will show every time)
        // // No storage
        
        // Option 2: Mark as shown for this session (current behavior)
        sessionStorage.setItem('welcomeShown', 'true');
        
        // Option 3: Mark as shown permanently
        // localStorage.setItem('welcomeShown', 'true');
    }
    
    /**
     * Initialize the welcome popup
     */
    init() {
        this.createPopup();
        this.show();
    }
    
    /**
     * Create the welcome popup DOM structure
     */
    createPopup() {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.className = 'welcome-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 3000;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create popup container
        this.container = document.createElement('div');
        this.container.className = 'welcome-popup';
        this.container.style.cssText = `
            background: white;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            width: 90%;
            max-width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: Calibri, sans-serif;
            animation: welcomeSlideIn 0.4s ease-out;
        `;
        
        // Create header
        const header = document.createElement('div');
        header.style.cssText = `
            background: linear-gradient(135deg, #2c5f2d, #4a8b3a);
            color: white;
            padding: 20px;
            border-radius: 12px 12px 0 0;
            position: relative;
        `;
        
        header.innerHTML = `
            <h2 style="margin: 0; font-size: 24px; text-align: center;">
                Welcome to the Socio-Economic Peace Index Tool
            </h2>
            <button class="welcome-close-btn" style="
                position: absolute;
                top: 15px;
                right: 20px;
                background: rgba(255, 255, 255, 0.2);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                width: 30px;
                height: 30px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 18px;
                font-weight: bold;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s;
            ">×</button>
        `;
        
        // Create content
        const content = document.createElement('div');
        content.style.cssText = `
            padding: 24px;
            line-height: 1.6;
        `;
        
        content.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <p style="font-size: 16px; color: #555; margin: 0;">
                    Interactive mapping platform for comprehensive socio-economic and peace analysis across Somalia
                </p>
            </div>
            
            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 15px 0; color: #2c5f2d; font-size: 18px;">
                    🎯 What is SEPI?
                </h3>
                <p style="margin: 0; color: #333; font-size: 14px;">
                    The <strong>Socio-Economic Peace Index</strong> is a composite indicator that measures economic development, 
                    social vulnerability, peace stability, and infrastructure accessibility across Somalia.
                </p>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 25px;">
                <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h4 style="margin: 0 0 8px 0; color: #007bff; font-size: 14px;">🗺️ Explore</h4>
                    <p style="margin: 0; font-size: 12px; color: #333;">
                        Click on regions to view detailed SEPI scores and regional data
                    </p>
                </div>
                <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; border-left: 4px solid #0ea5e9;">
                    <h4 style="margin: 0 0 8px 0; color: #0ea5e9; font-size: 14px;">🔧 Analyze</h4>
                    <p style="margin: 0; font-size: 12px; color: #333;">
                        Use sidebar controls to overlay additional data layers
                    </p>
                </div>
                <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #22c55e;">
                    <h4 style="margin: 0 0 8px 0; color: #22c55e; font-size: 14px;">📈 Compare</h4>
                    <p style="margin: 0; font-size: 12px; color: #333;">
                        Run analysis tools to compare different indicators
                    </p>
                </div>
                <div style="background: #fef7ff; padding: 15px; border-radius: 8px; border-left: 4px solid #a855f7;">
                    <h4 style="margin: 0 0 8px 0; color: #a855f7; font-size: 14px;">💡 Insights</h4>
                    <p style="margin: 0; font-size: 12px; color: #333;">
                        Access analysis panel for deeper insights and reports
                    </p>
                </div>
            </div>
            
            <div style="text-align: center;">
                <button class="welcome-start-btn" style="
                    background: linear-gradient(135deg, #2c5f2d, #4a8b3a);
                    color: white;
                    border: none;
                    padding: 12px 32px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                    box-shadow: 0 4px 12px rgba(44, 95, 45, 0.3);
                ">
                    Start Exploring →
                </button>
            </div>
        `;
        
        // Assemble popup
        this.container.appendChild(header);
        this.container.appendChild(content);
        overlay.appendChild(this.container);
        
        // Add to page
        document.body.appendChild(overlay);
        this.overlay = overlay;
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close button
        const closeBtn = this.container.querySelector('.welcome-close-btn');
        closeBtn.addEventListener('click', () => this.hide());
        
        // Start button
        const startBtn = this.container.querySelector('.welcome-start-btn');
        startBtn.addEventListener('click', () => this.hide());
        
        // Hover effects for buttons
        const buttons = this.container.querySelectorAll('button');
        buttons.forEach(btn => {
            if (btn.classList.contains('welcome-start-btn')) {
                btn.addEventListener('mouseover', () => {
                    btn.style.transform = 'translateY(-2px)';
                    btn.style.boxShadow = '0 6px 16px rgba(44, 95, 45, 0.4)';
                });
                btn.addEventListener('mouseout', () => {
                    btn.style.transform = 'translateY(0)';
                    btn.style.boxShadow = '0 4px 12px rgba(44, 95, 45, 0.3)';
                });
            } else if (btn.classList.contains('welcome-close-btn')) {
                btn.addEventListener('mouseover', () => {
                    btn.style.background = 'rgba(255, 255, 255, 0.3)';
                    btn.style.transform = 'scale(1.1)';
                });
                btn.addEventListener('mouseout', () => {
                    btn.style.background = 'rgba(255, 255, 255, 0.2)';
                    btn.style.transform = 'scale(1)';
                });
            }
        });
        
        // Close on overlay click
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) {
                this.hide();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }
    
    /**
     * Show the welcome popup
     */
    show() {
        if (this.overlay) {
            this.overlay.style.display = 'flex';
            this.isVisible = true;
            
            // Add animation styles
            if (!document.querySelector('#welcome-styles')) {
                const styles = document.createElement('style');
                styles.id = 'welcome-styles';
                styles.textContent = `
                    @keyframes welcomeSlideIn {
                        from {
                            opacity: 0;
                            transform: scale(0.8) translateY(20px);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                    }
                    
                    @keyframes welcomeSlideOut {
                        from {
                            opacity: 1;
                            transform: scale(1) translateY(0);
                        }
                        to {
                            opacity: 0;
                            transform: scale(0.8) translateY(-20px);
                        }
                    }
                `;
                document.head.appendChild(styles);
            }
        }
    }
    
    /**
     * Hide the welcome popup
     */
    hide() {
        if (this.container && this.isVisible) {
            // Add exit animation
            this.container.style.animation = 'welcomeSlideOut 0.3s ease-in';
            
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.isVisible = false;
                this.markAsShown();
            }, 300);
        }
    }
    
    /**
     * Force show the popup (for testing or help)
     */
    forceShow() {
        if (!this.container) {
            this.createPopup();
        }
        this.show();
    }
}