import React from 'react';
import { Tooltip } from "@douyinfe/semi-ui";

interface TimelineItem {
  eventName: string;
  completeTime: number;
  status: 'finished' | 'unfinished';
}

interface TimelineComponentProps {
  data: TimelineItem[];
  t: any;
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
};

function formatTime(time: number) {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
}

function abbrText(text: string) {
  if (text.length > 50) return text.slice(0, 50) + "...";
  return text;
}

export const TimelineComponent: React.FC<TimelineComponentProps> = ({ data, t }) => {
  if (!data || data.length === 0) {
    return (
      <div className="timeline-empty">
        <div className="empty-icon">📅</div>
        <div className="empty-text">{t('无数据提示') || '暂无时间线数据'}</div>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <div className="timeline-vertical">
        <div className="timeline-line"></div>
        {data.map((item, index) => {
          const stateStyle = stateStyleConfig[item.status];
          return (
            <div key={index} className="timeline-item">
              <div className="timeline-content">
                <div 
                  className="timeline-event" 
                  style={{ 
                    borderColor: stateStyle.color,
                    backgroundColor: stateStyle.background 
                  }}
                >
                  <div 
                    className="timeline-event-name" 
                    style={{ color: stateStyle.color }}
                  >
                    {item.eventName.length > 50 ? (
                      <Tooltip content={item.eventName} position="top">
                        <span>{abbrText(item.eventName)}</span>
                      </Tooltip>
                    ) : (
                      item.eventName
                    )}
                  </div>
                  <div className="timeline-event-time">
                    {formatTime(item.completeTime)}
                  </div>
                  <div 
                    className="timeline-event-status" 
                    style={{ color: stateStyle.color }}
                  >
                    {stateStyle.text}
                  </div>
                </div>
              </div>
              <div 
                className="timeline-node" 
                style={{ 
                  borderColor: stateStyle.color,
                  backgroundColor: 'var(--bg-body)'
                }}
              >
                <span className="status-icon" style={{ color: stateStyle.color }}>
                  {stateStyle.icon}
                </span>
              </div>
              <div className="timeline-content"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
