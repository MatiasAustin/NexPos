"use client";

import { createContext, useContext } from "react";

export interface SaasSettings {
    app_name: string;
    app_logo: string;
    logo_show_background?: boolean;
    support_email?: string;
    support_phone?: string;
    maintenance_mode?: boolean;
    plan_starter_price?: number;
    plan_pro_price?: number;
    plan_enterprise_price?: number;
}

const defaultSettings: SaasSettings = {
    app_name: '',
    app_logo: '',
    logo_show_background: false,
};

export const SaasSettingsContext = createContext<SaasSettings>(defaultSettings);

export function SaasSettingsProvider({ settings, children }: { settings: SaasSettings; children: React.ReactNode }) {
    return (
        <SaasSettingsContext.Provider value={settings}>
            {children}
        </SaasSettingsContext.Provider>
    );
}

export function useSaasSettings(): SaasSettings {
    return useContext(SaasSettingsContext);
}
