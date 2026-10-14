import React, { useEffect, useRef } from 'react';

declare global {
    interface Window {
        grecaptcha: any;
        onRecaptchaCallback: (token: string) => void;
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

    useEffect(() => {
        const scriptId = 'google-recaptcha-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
            script.async = true;
            script.defer = true;
            script.onload = renderWidget;
            document.head.appendChild(script);
        } else if (window.grecaptcha && window.grecaptcha.render) {
            renderWidget();
        }

        function renderWidget() {
            if (!containerRef.current || widgetIdRef.current !== null) return;
            widgetIdRef.current = window.grecaptcha.render(containerRef.current, {
                sitekey: RECAPTCHA_SITE_KEY,
                callback: (token: string) => onChange(token),
                'expired-callback': () => onChange(null),
                'error-callback': () => onChange(null),
                theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
            });
        }

        return () => {
            if (widgetIdRef.current !== null && window.grecaptcha && window.grecaptcha.reset) {
                try { window.grecaptcha.reset(widgetIdRef.current); } catch {}
                widgetIdRef.current = null;
            }
        };
    }, []);

    return <div ref={containerRef} className="flex justify-center" />;
};

export default RecaptchaWidget;
