import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        grecaptcha: any;
    }
}

// Google reCAPTCHA v2 test keys — always pass. Replace with real keys in production.
export const RECAPTCHA_SITE_KEY = '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

interface Props {
    onChange: (token: string | null) => void;
}

const RecaptchaWidget: React.FC<Props> = ({ onChange }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const onChangeRef = useRef(onChange);
    onChangeRef.current = onChange;

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        const renderWidget = () => {
            if (!containerRef.current || widgetIdRef.current !== null) return;
            if (!window.grecaptcha || typeof window.grecaptcha.render !== 'function') return;
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
                sitekey: RECAPTCHA_SITE_KEY,
                callback: (token: string) => onChangeRef.current(token),
                'expired-callback': () => onChangeRef.current(null),
                'error-callback': () => onChangeRef.current(null),
                theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
            });
            clearInterval(interval);
        };

        const loadScript = () => {
            const existing = document.getElementById('google-recaptcha-script') as HTMLScriptElement | null;
            if (existing) {
                // Script tag exists — poll until grecaptcha.render is available
                renderWidget();
                interval = setInterval(renderWidget, 100);
                return;
            }
            const script = document.createElement('script');
            script.id = 'google-recaptcha-script';
            script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                renderWidget();
                interval = setInterval(renderWidget, 100);
            };
            document.head.appendChild(script);
        };

        loadScript();

        return () => {
            clearInterval(interval);
            if (widgetIdRef.current !== null && window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
                try { window.grecaptcha.reset(widgetIdRef.current); } catch {}
                widgetIdRef.current = null;
            }
        };
    }, []);

    return <div ref={containerRef} className="flex justify-center" />;
};

export default RecaptchaWidget;
