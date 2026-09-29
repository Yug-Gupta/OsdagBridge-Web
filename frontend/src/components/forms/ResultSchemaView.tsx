import React, { useEffect, useState } from 'react';
import { fetchResultSchemas, type ResultSchemas } from '../../services/api';
import { AdditionalInputsSchema } from './AdditionalInputsSchema';

/**
 * Renders a desktop result-dialog schema (from the engine's ui_fields) so the
 * web dialogs mirror the exact desktop structure. Values are supplied by the
 * backend through the same schema ids; until results endpoints are live the
 * fields render empty.
 */
export const ResultSchemaView: React.FC<{ which: keyof ResultSchemas }> = ({ which }) => {
  const [schemas, setSchemas] = useState<ResultSchemas | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchResultSchemas()
      .then((data) => {
        if (!cancelled) setSchemas(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load schema');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div role="alert" style={{ color: 'var(--danger)', fontSize: '12px' }}>
        Unable to load design details: {error}
      </div>
    );
  }
  if (!schemas) {
    return <div style={{ color: 'var(--text-sub)', fontSize: '12px' }}>Loading design details…</div>;
  }
  return <AdditionalInputsSchema schema={schemas[which]} />;
};
