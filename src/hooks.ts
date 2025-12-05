import { DashboardState, ThemeModeType, bitable, dashboard } from "@lark-base-open/js-sdk";
import React from "react";
import { useLayoutEffect } from "react";

function updateTheme(theme: string) {
  document.body.setAttribute('theme-mode', theme);
}

/** 跟随主题色变化 */
export function useTheme() {
  useLayoutEffect(() => {
    (async () => {
      try {
        const res = await dashboard.getTheme();
        updateTheme(res.theme == ThemeModeType.DARK ? 'dark' : 'light');
        document.documentElement.style.setProperty('--cbgc', res.chartBgColor || 'var(--bg-color)')
      } catch (_) {
        updateTheme('light');
        document.documentElement.style.setProperty('--cbgc', getComputedStyle(document.documentElement).getPropertyValue('--bg-color') || '#ffffff')
      }
    })();

    try {
      dashboard.onThemeChange(res => {
        updateTheme(res.data.theme == ThemeModeType.DARK ? 'dark' : 'light');
        document.documentElement.style.setProperty('--cbgc', res.data.chartBgColor || getComputedStyle(document.documentElement).getPropertyValue('--bg-color'))
      });
    } catch (_) {}
  }, [])
}

/** 初始化、更新config */
export function useConfig(updateConfig: (data: any) => void) {

  const isCreate = (() => {
    try {
      return dashboard.state === DashboardState.Create
    } catch (_) {
      return true
    }
  })()
  React.useEffect(() => {
    if (isCreate) {
      return
    }
    (async () => {
      try {
        const cfg = await dashboard.getConfig();
        updateConfig(cfg);
      } catch (_) {}
    })();
  }, []);


  React.useEffect(() => {
    try {
      const offConfigChange = dashboard.onConfigChange((r) => {
        updateConfig(r.data);
      });
      return () => {
        offConfigChange();
      }
    } catch (_) {
      return () => {}
    }
  }, []);
}
