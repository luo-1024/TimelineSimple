import React, { useEffect, useState } from "react";
import "./style.css";
import "./timeline.css";
import { Tooltip } from "@douyinfe/semi-ui";
import { TimelineComponent } from './TimelineComponent';
// @ts-ignore
import NotFoundSVG from "../../assets/illustration_empty-neutral-no-access.svg";

let configing = false
let globalT = undefined as any

function c(className: any) {
  if (configing) {
    return className + " config"
  }
  return className
}

const stateStyleConfig = {
  finished: {
    color: "var(--finished)",
    background: "var(--bg-finished)",
    text: "已完成",
    icon: "✓"
  },
  unfinished: {
    color: "var(--unfinished)",
    background: "var(--bg-unfinished)",
    text: "未完成",
    icon: "○"
  }
}

function abbrText(text: any) {
  if (text.length > 30)
    return text.slice(0, 30) + "...";
  return text;
}

function computeStatus(completeTime: number): 'finished' | 'unfinished' {
  const nowTime = new Date().getTime();
  if (!completeTime) return "unfinished";
  return completeTime <= nowTime ? "finished" : "unfinished";
}

function formatTime(time: any) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function Item({ eventName, completeTime }: any) {
  const stateStyle = stateStyleConfig[computeStatus(completeTime)]
  return (
    <div className={c("item")} style={{ '--primaryColor': stateStyle.color, '--secondaryColor': stateStyle.background } as React.CSSProperties}>
      {eventName.length > 30 ?
        <Tooltip content={eventName} position="right">
          <div className={c("eventName")}>{abbrText(eventName)}</div>
        </Tooltip> :
        <div className={c("eventName")}>{abbrText(eventName)}</div>
      }
      <div className={c("circle")}>
        <span className="status-icon">{stateStyle.icon}</span>
      </div>
      <div className={c("state")}>{stateStyle.text}</div>
      <Tooltip content={`${globalT('field.completeTime')}: ${formatTime(completeTime)}`} position="right">
        <div className={c("datetime")}>{formatTime(completeTime)}</div>
      </Tooltip>
    </div>
  )
}

export function DashboardView(props: any) {
  const { isConfig, t, previewConfig, bitable } = props;
  globalT = t
  const effectiveConfig = isConfig && previewConfig ? previewConfig : props['config']
  const [timelineData, setTimelineData] = useState([]) as any;
  const [isTableNotFound, setIsTableNotFound] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 50; // 每页50条记录

  useEffect(() => {
    configing = isConfig
  }, [isConfig])
  useEffect(() => {
    const config = effectiveConfig
    if (!config || !bitable) return;
    const { eventFieldId, completeTimeFieldId, selectedTableId } = config;
    if (!(eventFieldId && completeTimeFieldId && selectedTableId)) return;
    const timer = setTimeout(() => {
      setTimelineData([]);
      setCurrentPage(1);
      setHasMore(true);
      setIsTableNotFound(false);
      (async () => {
        let table;
        try {
          table = await bitable.base.getTable(selectedTableId);
        } catch (error) {
          console.log('====getTable error====', selectedTableId, bitable, error)
          setIsTableNotFound(true);
          return;
        }
        setIsLoading(true);
        let recordIdData;
        let token;
        const dataTemp = [] as any[];
        let recordCount = 0;
        try {
          do {
            recordIdData = await table.getRecordIdListByPage(token ? { pageToken: token, pageSize } : { pageSize });
            token = recordIdData.pageToken;
            const recordIdList = recordIdData.recordIds;
            const eventField = await table.getFieldById(eventFieldId);
            const completeTimeField = await table.getFieldById(completeTimeFieldId);
            for (const recordId of recordIdList) {
              const eventValue = await eventField.getValue(recordId);
              const completeTimeValue = await completeTimeField.getValue(recordId);
              if (eventValue && completeTimeValue) {
                dataTemp.push({ eventName: eventValue[0]?.text || '', completeTime: completeTimeValue, status: computeStatus(completeTimeValue) });
                recordCount++;
                if (recordCount >= pageSize) break;
              }
            }
            setHasMore(recordIdData.hasMore && recordCount < pageSize);
          } while (recordIdData.hasMore && recordCount < pageSize);
          dataTemp.sort((a: any, b: any) => a.completeTime - b.completeTime);
          setTimelineData(dataTemp);
        } catch (error) {
          console.log('====getTableXXXX error====', selectedTableId, bitable, error);
          setIsTableNotFound(true);
        } finally {
          setIsLoading(false);
        }
      })();
    }, 300);
    return () => clearTimeout(timer);
  }, [effectiveConfig?.eventFieldId, effectiveConfig?.completeTimeFieldId, effectiveConfig?.selectedTableId, bitable])

  if (isLoading) {
    return (
      <div className="timeline-empty">
        <div className="empty-icon">⏳</div>
        <div className="empty-text">加载中...</div>
      </div>
    );
  }
  
  if (!isConfig && isTableNotFound) {
    return (
      <div className="timeline-empty">
        <img className="empty-icon" src={NotFoundSVG} />
        <div className="empty-text">{t("无权限查看组件")}</div>
      </div>
    );
  }
  
  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="empty-icon">📅</div>
        <div className="empty-text">{t('无数据提示') || '暂无时间线数据'}</div>
      </div>
    );
  }

  return (
    <>
      <TimelineComponent data={timelineData} t={t} />
      {hasMore && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <span style={{ color: 'var(--text-caption)', fontSize: '12px' }}>
            已显示 {timelineData.length} 条记录
          </span>
        </div>
      )}
    </>
  )
}
