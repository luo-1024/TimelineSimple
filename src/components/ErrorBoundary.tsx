import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{display:'flex',height:'100vh',alignItems:'center',justifyContent:'center',color:'var(--text)',background:'var(--cbgc)'}}>
          <div style={{textAlign:'center'}}>
            <div style={{fontSize:16,marginBottom:8}}>页面加载失败</div>
            <div style={{fontSize:12,color:'var(--text-caption)'}}>请刷新或检查配置</div>
          </div>
        </div>
      );
    }
    return this.props.children as React.ReactElement;
  }
}
