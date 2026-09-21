import React from 'react';
import { Brain, ShieldCheck, Cpu, SlidersHorizontal, LockKeyhole, Radio } from 'lucide-react';

const STEPS = [
  { id: 'AGENT_THOUGHT', label: 'Agent', detail: 'Request prepared', icon: Brain },
  { id: 'REF_MONITOR', label: 'Monitor', detail: 'Permission checked', icon: ShieldCheck },
  { id: 'DS_FUSION', label: 'Trust', detail: 'Evidence combined', icon: Cpu },
  { id: 'POLICY_ENGINE', label: 'Policy', detail: 'Rules evaluated', icon: SlidersHorizontal },
  { id: 'ENFORCEMENT', label: 'Enforce', detail: 'Decision applied', icon: LockKeyhole },
];

const STEP_INDEX = {
  IDLE: -1,
  AGENT_THOUGHT: 0,
  SYSCALL: 0,
  REF_MONITOR: 1,
  ALLOW: 1,
  DENY: 1,
  DS_FUSION: 2,
  POLICY_ENGINE: 3,
  COMPLETE: 4,
};

export default function StickyPipelineFlow({ activeStage = 'IDLE', stageDetail = null, securityState = 'NORMAL', trust }) {
  const activeIndex = securityState !== 'NORMAL' ? 4 : (STEP_INDEX[activeStage] ?? -1);
  const currentWidth = `${Math.max(0, activeIndex) * 21}%`;
  const conflict = trust?.conflict ?? 0;
  const stateLabel = securityState === 'CRITICAL' ? 'Contained' : securityState === 'RESTRICTED' ? 'Restricted' : 'Protected';

  const status = {
    AGENT_THOUGHT: 'The agent is preparing a request.',
    SYSCALL: 'The request is moving to the operating system.',
    REF_MONITOR: 'Checking the request against its assigned permissions.',
    ALLOW: 'Request approved within the assigned task boundary.',
    DENY: 'Request blocked before it reached the resource.',
    DS_FUSION: 'Updating the trust assessment with the latest evidence.',
    POLICY_ENGINE: 'Applying the security policy to the current trust state.',
    COMPLETE: 'Security state and audit record updated.',
    IDLE: 'Waiting for the next agent action.',
  }[activeStage] || 'Waiting for the next agent action.';

  return (
    <section className={`flow-rail state-${securityState.toLowerCase()}`} aria-label="Security decision flow">
      <div className="flow-rail-top">
        <div className="flow-title">
          <span className="flow-live-dot"><Radio className="w-3.5 h-3.5" /></span>
          <div>
            <span className="flow-kicker">Live decision flow</span>
            <span className="flow-subtitle">Every action is checked before it runs</span>
          </div>
        </div>
        <div className="flow-metrics">
          <span className="flow-state">{stateLabel}</span>
          <span className="hidden sm:inline">Conflict {conflict.toFixed(2)}</span>
        </div>
      </div>

      <div className="flow-track-wrap">
        <div className={`flow-current ${activeIndex >= 0 ? 'is-moving' : ''}`} style={{ width: currentWidth }} />
        <div className="flow-steps">
          {STEPS.map(({ id, label, detail, icon: Icon }, index) => {
            const completed = activeIndex > index;
            const current = activeIndex === index;
            return (
              <div className={`flow-step ${completed ? 'is-complete' : ''} ${current ? 'is-current' : ''}`} key={id}>
                <div className="flow-node"><Icon className="w-4 h-4" /></div>
                <div className="flow-copy">
                  <span>{label}</span>
                  <small>{detail}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flow-status" aria-live="polite">
        <span className="flow-status-label">Now</span>
        <span>{status}</span>
      </div>
    </section>
  );
}
