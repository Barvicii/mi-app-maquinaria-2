// src/app/admin/prestart-templates/page.js
'use client';

import React, { useState } from 'react';
import MachinesRegistry from '@/components/MachinesRegistry';
import PreStartTemplateManager from '@/components/PreStartTemplateManager';

export default function PreStartTemplatesPage() {
  return (
    <MachinesRegistry initialTab="prestart-templates">
      <div className="container mx-auto py-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-6">PreStart Check Templates</h1>
          <PreStartTemplateManager />
        </div>
      </div>
    </MachinesRegistry>
  );
}