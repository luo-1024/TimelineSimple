import './style.css';
import React, { useLayoutEffect, useMemo } from 'react';
import { dashboard as dashboardSdk, DashboardState, IConfig, IDashboard, bitable as bitableSdk, workspace, bridge } from "@lark-base-open/js-sdk";
import { Button, DatePicker, ConfigProvider, Checkbox, Row, Col, Input, Switch, Select } from '@douyinfe/semi-ui';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useConfig } from '../../hooks';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next/typescript/t';
import DashboardConfig from '../DashboardConfig';
import { DashboardView } from '../DashboardView';

/** 倒计时 */
export default function Dashboard() {

  const { t, i18n } = useTranslation();

  const [previewConfig, setPreviewConfig] = useState(null) as any

  // create时的默认配置
  const [config, setConfig] = useState({
    eventFieldId: null,
    completeTimeFieldId: null,
    baseToken: null,
    fontSize: 'medium',
    spacing: 'medium',
    displayMode: 'vertical',
    statusMode: 'none',
  })
  const [dashboard, setDashboard] = useState<IDashboard>(dashboardSdk)
  const isLocalDev = typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)/.test(window.location.hostname);
  const [bitable, setBitable] = useState<typeof bitableSdk | null>(isLocalDev ? null : bitableSdk);
  const [isMultipleBase, setIsMultipleBase] = useState<boolean | undefined>(undefined);
  const [configLoaded, setConfigLoaded] = useState(false);

  const safeState = (() => {
    try {
      return dashboard.state
    } catch (_) {
      return DashboardState.Config
    }
  })()
  const isCreate = safeState === DashboardState.Create
  const isView = safeState === DashboardState.View

  useEffect(() => {
    (async () => {
      try {
        const env = await bridge.getEnv();
        setIsMultipleBase(env.needChangeBase ?? false);
      } catch (_) {
        setIsMultipleBase(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (isMultipleBase && !config?.baseToken) {
        setBitable(null);
        setDashboard(dashboardSdk);
        return;
      }
      // view模式下，getBitable由于实现问题会报错，使用默认导出的bitable能保证baseToken、tableId正常渲染，先用该方式绕过
      try {
        const realBitable = (isMultipleBase && !isView)
          ? await workspace.getBitable(config.baseToken as any)
          : bitableSdk;
        setBitable(realBitable);
        setDashboard(realBitable?.dashboard || dashboardSdk);
      } catch (_) {
        setBitable(null);
        setDashboard(dashboardSdk);
      }
    })();
  }, [config.baseToken, isMultipleBase]);

  useEffect(() => {
    if (isCreate) {
      setConfig({
        eventFieldId: null,
        completeTimeFieldId: null,
        baseToken: null,
        fontSize: 'medium',
        spacing: 'medium',
        displayMode: 'vertical',
        statusMode: 'none',
      })
    }
  }, [i18n.language, isCreate])

  const isConfig = safeState === DashboardState.Config || isCreate;

  const timer = useRef<any>()

  /** 配置用户配置 */
  const updateConfig = (res: IConfig) => {
    if (timer.current) {
      clearTimeout(timer.current)
    }
    const { customConfig, dataConditions } = res;
    if (customConfig) {
      customConfig.selectedTableId = dataConditions[0].tableId;
      setConfig({...customConfig, baseToken: dataConditions[0].baseToken } as any);
      timer.current = setTimeout(() => {
        //自动化发送截图。 预留3s给浏览器进行渲染，3s后告知服务端可以进行截图了（对域名进行了拦截，此功能仅上架部署后可用）。
        dashboard.setRendered();
      }, 3000);

    }
    setConfigLoaded(true);
  }

  useConfig(updateConfig)

  return (
    <main className={isConfig ? 'cfg-on' : ''} style={isConfig ? {backgroundColor: "var(--cbgc)"} : { borderTop: 'none' ,backgroundColor: "var(--cbgc)"}}>
      <div className='layout-view' >
        <_DashboardView
          t={t}
          config={config}
          isConfig={isConfig}
          previewConfig={previewConfig}
          bitable={bitable}
        />
      </div>
      {
        isConfig && (
          <div className='layout-cfg'>
            <ConfigPanel 
              t={t} 
              config={config} 
              setConfig={setConfig} 
              setPreviewConfig={setPreviewConfig} 
              dashboard={dashboard} 
              bitable={bitable}
              isMultipleBase={isMultipleBase}
              configLoaded={configLoaded}
            />
          </div>
        )
      }
    </main>
  )
}


interface IDashboardView {
  config: any,
  isConfig: boolean,
  previewConfig: any,
  t: TFunction<"translation", undefined>,
  bitable: typeof bitableSdk | null,
}
function _DashboardView({ config, isConfig, t, previewConfig, bitable }: IDashboardView) {
  return (
    <>
      <div className="view">
        <DashboardView config={config} isConfig={isConfig} t={t} previewConfig={previewConfig} bitable={bitable}></DashboardView>
      </div>
    </>
  );
}

function ConfigPanel(props: {
  config: any,
  setConfig: any,
  setPreviewConfig: any,
  t: TFunction<"translation", undefined>,
  dashboard: IDashboard,
  bitable: typeof bitableSdk | null,
  isMultipleBase: boolean | undefined,
  configLoaded: boolean,
}) {
  const { config, setConfig, t, setPreviewConfig, dashboard, bitable, isMultipleBase, configLoaded } = props;
  const configRef = useRef(null) as any;
  /**保存配置 */
  const onSaveConfig = () => {
    const cfg = configRef.current.handleSetConfig()

    if (!cfg) return

    const saveConfig = {
      customConfig: (()=>{const {selectedTableId, ...tmp} = cfg;return tmp})(),
      dataConditions:
        [{
          tableId: cfg.selectedTableId,
          baseToken: config.baseToken,
        }]
    } as any
    dashboard.saveConfig(saveConfig)
  }

  return (
    <>
      <div className="layout-cfg-main">
        <DashboardConfig 
          config={config} 
          setConfig={setConfig} 
          t={t} 
          ref={configRef} 
          onConfigChange={(e: any) => { setPreviewConfig(e) }}
          dashboard={dashboard}
          bitable={bitable}
          isMultipleBase={isMultipleBase}
          configLoaded={configLoaded}
        />
      </div>
      <div className="layout-cfg-btn">
        <a href="https://bytedance.larkoffice.com/wiki/Vchyw69Zniiq4SkayVcczmf3nXl?renamingWikiNode=false" target="_blank" rel="noopener noreferrer" className="helpLinkBottom">{t('帮助文档')}</a>
        <Button type='primary' theme='solid' size='large' className='confirmButton' onClick={onSaveConfig}>{t('button.confirm')}</Button>
      </div>
    </>
  )
}
