import { useState } from 'react';
import { AssertionRule, AssertionType } from '../types';

interface Props {
  assertions: AssertionRule[];
  onChange: (rules: AssertionRule[]) => void;
}

const ASSERTION_LABELS: Record<AssertionType, string> = {
  'status-equals': 'Status code equals',
  'status-not-equals': 'Status code is not',
  'response-time-lt': 'Response time <',
  'body-contains': 'Body contains',
  'jsonpath-equals': 'JSONPath equals',
};

function buildLabel(rule: AssertionRule): string {
  switch (rule.type) {
    case 'status-equals': return `Status code equals ${rule.value}`;
    case 'status-not-equals': return `Status code is not ${rule.value}`;
    case 'response-time-lt': return `Response time < ${rule.value}ms`;
    case 'body-contains': return `Body contains "${rule.value}"`;
    case 'jsonpath-equals': return `${rule.path} equals "${rule.value}"`;
  }
}

export default function AssertionsConfig({ assertions, onChange }: Props) {
  const [draftType, setDraftType] = useState<AssertionType>('status-equals');
  const [draftValue, setDraftValue] = useState('200');
  const [draftPath, setDraftPath] = useState('$.data.id');

  const addAssertion = () => {
    if (!draftValue.trim()) return;
    const rule: AssertionRule = {
      id: crypto.randomUUID(),
      type: draftType,
      value: draftValue.trim(),
      path: draftType === 'jsonpath-equals' ? draftPath.trim() : undefined,
    };
    onChange([...assertions, rule]);
    setDraftValue(draftType === 'status-equals' || draftType === 'status-not-equals' ? '200' : '');
  };

  const remove = (id: string) => onChange(assertions.filter((a) => a.id !== id));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 space-y-4">
      <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Tests</h2>

      <div className="space-y-2">
        <select
          value={draftType}
          onChange={(e) => {
            const t = e.target.value as AssertionType;
            setDraftType(t);
            setDraftValue(t === 'status-equals' || t === 'status-not-equals' ? '200' : t === 'response-time-lt' ? '500' : '');
          }}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500"
        >
          {(Object.entries(ASSERTION_LABELS) as [AssertionType, string][]).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {draftType === 'jsonpath-equals' && (
          <input
            type="text"
            placeholder="$.data.id"
            value={draftPath}
            onChange={(e) => setDraftPath(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500 font-mono"
          />
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={draftType === 'status-equals' || draftType === 'status-not-equals' || draftType === 'response-time-lt' ? 'number' : 'text'}
              placeholder={
                draftType === 'status-equals' || draftType === 'status-not-equals' ? '200'
                  : draftType === 'response-time-lt' ? '500'
                  : draftType === 'body-contains' ? 'expected text'
                  : 'expected value'
              }
              value={draftValue}
              onChange={(e) => setDraftValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addAssertion()}
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-100 focus:outline-none focus:border-orange-500 pr-10"
            />
            {draftType === 'response-time-lt' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500">ms</span>
            )}
          </div>
          <button
            onClick={addAssertion}
            className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm rounded font-medium"
          >
            Add
          </button>
        </div>
      </div>

      {assertions.length > 0 && (
        <ul className="space-y-1.5">
          {assertions.map((rule) => (
            <li key={rule.id} className="flex items-center justify-between bg-gray-800 rounded px-3 py-1.5 text-sm">
              <span className="text-gray-300">{buildLabel(rule)}</span>
              <button
                onClick={() => remove(rule.id)}
                className="text-gray-600 hover:text-red-400 ml-2 text-base leading-none"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
