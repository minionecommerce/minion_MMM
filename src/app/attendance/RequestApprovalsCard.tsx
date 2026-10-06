'use client';

import { useState } from 'react';
import { Card, SelectBox } from './ui';

// The four kinds of request. This phase is the screen only: choosing one submits nothing and there is no approval workflow yet.
const REQUEST_TYPES = ['Approval of Late Leave Request', 'Approval of Late Login', 'Approval of Permission Request', 'Approval of Site Visit Request'];

export default function RequestApprovalsCard() {
  const [type, setType] = useState('');

  return (
    <Card title="Request Approvals">
      <SelectBox value={type} onChange={setType} label="Select Request Type" className="max-w-[460px]">
        <option value="">Select Request Type</option>
        {REQUEST_TYPES.map(t => (
          <option key={t} value={t}>{t}</option>
        ))}
      </SelectBox>
      {type && <p className="mt-3 text-[13px] text-[#6B7280]">{type}: requests and their approval will be available in a later phase. Nothing is submitted from here yet.</p>}
    </Card>
  );
}
