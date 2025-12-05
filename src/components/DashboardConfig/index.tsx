import React, { useCallback, useEffect, useImperativeHandle, useMemo, useState } from "react";
import "./style.css";
import { DashboardState, FieldType, bitable as bitableSdk, bridge, workspace, dashboard as dashboardSdk } from '@lark-base-open/js-sdk';
import { Button, Input, Select, Spin, Toast } from "@douyinfe/semi-ui";
import BaseSelector from "../BaseSelector";
import { debounce } from 'lodash-es';

let isInited = false

function FieldSelect({ t, fieldList, promptTKey, fieldId, setFieldId, fieldType, placeholder, mutuallyExclusiveId, tableLoading }: any) {
  return (<>
    <div className="prompt">{t(promptTKey)}</div>
    <Select dropdownMatchSelectWidth placeholder={t(placeholder)} className="select" optionList={
      fieldList.filter((v: any, i: any) => {
        return v.fieldType == fieldType && v.fieldId != mutuallyExclusiveId
      }).map((v: any, i: any) => {
        return {
          "label": v.fieldName,
          "value": v.fieldId
        }
      })
    } onChange={(e) => {
      setFieldId(e)
    }} value={fieldId}
    disabled={tableLoading}
    renderSelectedItem={tableLoading ? () => <Spin /> : undefined}
    ></Select >
  </>
  )
}

function DashboardConfig(props: any, ref: any) {
  const { dashboard, isMultipleBase, bitable, configLoaded } = props;
  const isCreate = dashboard.state === DashboardState.Create

  const { config, setConfig, t, onConfigChange } = props;
  const [tableList, setTableList] = useState([]) as any;
  const [fieldList, setFieldList] = useState([]) as any;

  const [selectedTableId, setSelectedTableId] = useState(null) as any;
  const [eventFieldId, setEventFieldId] = useState(null) as any;
  const [completeTimeFieldId, setCompleteTimeFieldId] = useState(null) as any;
  const [tableLoading, setTableLoading] = useState(false);
  const [isPreviewUpdating, setIsPreviewUpdating] = useState(false);

  // 防抖处理配置变更
  const debouncedPreviewUpdate = useCallback(
    debounce((configData: any) => {
      onConfigChange(configData);
      setIsPreviewUpdating(false);
    }, 500),
    [onConfigChange]
  );

   useEffect(() => {
    const getBaseToken = async () => {
      if (!configLoaded || !isMultipleBase || config?.baseToken) {
        return;
      }
      const baseList = await workspace.getBaseList({
        query: "",
        page: {
          cursor: "",
        },
      });
      const initialBaseToken = baseList?.base_list?.[0]?.token || "";
      setConfig({
        ...config,
        baseToken: initialBaseToken,
      })
    };

    getBaseToken();
  }, [isMultipleBase, configLoaded]);

  useEffect(() => {
    (async () => {
      if (!bitable) {
        setTableList([{ tableId: 'dev-table', tableName: '示例表' }]);
        setFieldList([
          { fieldId: 'event', fieldName: '事件名称', fieldType: FieldType.Text },
          { fieldId: 'completeTime', fieldName: '完成时间', fieldType: FieldType.DateTime },
        ]);
        if (!selectedTableId) setSelectedTableId('dev-table');
        return;
      }
      setTableLoading(true);
      const tables = await bitable.base.getTableList();
      setTableList(
        await Promise.all(
          tables.map(
            async (table: any) => {
              const name = await table.getName();
              return {
                tableId: table.id,
                tableName: name
              }
            }
          )
        )
      )
      setTableLoading(false);
    })();
  }, [bitable])

  if (config)
    useEffect(() => {
      if (selectedTableId && eventFieldId && completeTimeFieldId) {
        // 防抖处理实时预览更新
        setIsPreviewUpdating(true);
        debouncedPreviewUpdate({
          eventFieldId: eventFieldId,
          completeTimeFieldId: completeTimeFieldId,
          selectedTableId: selectedTableId,
        })
      }
    }, [selectedTableId, eventFieldId, completeTimeFieldId, debouncedPreviewUpdate]);

  useEffect(() => {
    if (isInited) return;
    if (isCreate) { // 创建状态时设置默认值
      (async () => {
        if (!bitable) return
        const tables = await bitable.base.getTableList();
        if (tables.length == 0) return
        setSelectedTableId(tables[0].id);
        onSelect(tables[0].id, undefined)?.then((_fieldList) => {
          let _eventFieldId = false;
          let _completeTimeFieldId = false;
          for (const field of _fieldList.reverse()) {
            if (!_eventFieldId && field.fieldType == FieldType.Text) {
              setEventFieldId(field['fieldId'])
              _eventFieldId = true
              continue
            }
            if (field.fieldType != FieldType.DateTime) continue;
            if (!_completeTimeFieldId) {
              setCompleteTimeFieldId(field['fieldId'])
              _completeTimeFieldId = true
            }
          }

        });

      })();
    }
    if (!config?.selectedTableId) return; // 配置状态时使用config值
    if (config.selectedTableId) setSelectedTableId(config.selectedTableId);
    dashboard.getCategories(config.selectedTableId).then((e: any) => {
      setFieldList(e)
      if (config.eventFieldId) setEventFieldId(config.eventFieldId);
      if (config.completeTimeFieldId) setCompleteTimeFieldId(config.completeTimeFieldId);
      isInited = true
    })
  }, [dashboard, bitable])

  function onSelect(value: any, option: any) {
    if (!value) return
    return (async () => {
      setEventFieldId(null)
      setCompleteTimeFieldId(null)
      const _fieldList = await dashboard.getCategories(value)
      setFieldList(_fieldList)
      return _fieldList
    })();
  }

  const handleBaseChange = (baseToken: string) => {
    setConfig({ ...config, baseToken })
    setSelectedTableId(null)
    setEventFieldId(null)
    setCompleteTimeFieldId(null)
  }

  useImperativeHandle(ref, () => ({
    handleSetConfig() {
      if (!(eventFieldId && completeTimeFieldId)) {
        Toast.error({
          content: t('toast.error')
        })
        return false
      }
      const cfg = {
        eventFieldId: eventFieldId,
        completeTimeFieldId: completeTimeFieldId,
        selectedTableId: selectedTableId,
      }
      setConfig({ ...config, ...cfg })

      return cfg
    }
  }));

  return (
    <>
      <div style={{ background: 'transparent' }}>
        {isMultipleBase &&
          <BaseSelector
            baseToken={config.baseToken}
            onChange={handleBaseChange}
          />
        }
        <div className="prompt">{t('tableSource')}</div>
        <Select 
          placeholder={t('placeholder.pleaseSelectTable')} className="select" 
          optionList={
            tableList.map((v: any) => { return { label: v.tableName, value: v.tableId } })
          } 
          onChange={(e) => { setSelectedTableId(e) }} 
          value={selectedTableId} 
          onSelect={onSelect}
          disabled={tableLoading}
          renderSelectedItem={tableLoading ? () => <Spin /> : undefined}
        >
        </Select>

        <FieldSelect t={t} fieldList={fieldList} promptTKey='field.event' fieldId={eventFieldId} setFieldId={setEventFieldId} fieldType={FieldType.Text} placeholder="placeholder.pleaseSelectField" mutuallyExclusiveId={null} tableLoading={tableLoading}></FieldSelect>
        <FieldSelect t={t} fieldList={fieldList} promptTKey='field.completeTime' fieldId={completeTimeFieldId} setFieldId={setCompleteTimeFieldId} fieldType={FieldType.DateTime} placeholder="placeholder.pleaseSelectDateField" mutuallyExclusiveId={null} tableLoading={tableLoading}></FieldSelect>
        <div className="title">
          <div className="titlet">
            <a className="help" href="https://wingahead.feishu.cn/wiki/NjoJwa38WidGiikx8i2cyUeKnsd?from=from_copylink" target="_blank" rel="noopener noreferrer">帮助文档</a>
          </div>
        </div>
      </div>
    </>
  )
}

export default React.forwardRef(DashboardConfig)
