// Derechos ARCO desde la app: aceptar el aviso, oposicion (opt-out) y cancelacion de la cuenta.
import { useCallback, useEffect, useState } from 'react';
import { repositories } from '../../data/repositories';
import { PrivacyRepository } from '../../data/repositories/PrivacyRepository';
import { DELETE_CONFIRMATION, isDeleteConfirmed, PrivacyPreference, PrivacySettings } from '../../domain/privacy';
import { ActionResult, errorMessage } from './types';

export function usePrivacyViewModel(
  token: string | null,
  onAccountDeleted: () => Promise<void>,
  privacy: PrivacyRepository = repositories.privacy,
) {
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState<PrivacyPreference | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      setSettings(await privacy.get());
    } catch (error) {
      setLoadError(errorMessage(error, 'No fue posible consultar tu privacidad.'));
    } finally {
      setLoading(false);
    }
  }, [privacy]);

  useEffect(() => {
    if (token) void load();
    else {
      setSettings(null);
      setDeleteText('');
    }
  }, [token, load]);

  // Solo se pide aceptar el aviso cuando ya se sabe que no lo ha aceptado (no mientras carga o si falla).
  const needsConsent = Boolean(settings && !settings.acceptedAt);

  const acceptNotice = async (): Promise<ActionResult | null> => {
    setAccepting(true);
    try {
      setSettings(await privacy.acceptNotice());
      return null;
    } catch (error) {
      return { ok: false, title: 'No fue posible guardar tu aceptacion', message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setAccepting(false);
    }
  };

  // El switch cambia al instante y regresa a su valor si el servidor no confirma el cambio.
  const setPreference = async (preference: PrivacyPreference, enabled: boolean): Promise<ActionResult | null> => {
    if (!settings) return null;
    const previous = settings;
    setSettings({ ...settings, [preference]: enabled });
    setSaving(preference);
    try {
      setSettings(await privacy.update(preference, enabled));
      return null;
    } catch (error) {
      setSettings(previous);
      return { ok: false, title: 'No se guardo tu preferencia', message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setSaving(null);
    }
  };

  const deleteAccount = async (): Promise<ActionResult | null> => {
    if (!isDeleteConfirmed(deleteText)) {
      return { ok: false, title: 'Confirma la eliminacion', message: `Escribe ${DELETE_CONFIRMATION} para eliminar tu cuenta.` };
    }
    setDeleting(true);
    try {
      await privacy.deleteAccount(DELETE_CONFIRMATION);
      await onAccountDeleted();
      return { ok: true, title: 'Cuenta eliminada', message: 'Borramos tus datos personales y cancelamos tus citas futuras.' };
    } catch (error) {
      return { ok: false, title: 'No fue posible eliminar la cuenta', message: errorMessage(error, 'Intenta nuevamente.') };
    } finally {
      setDeleting(false);
    }
  };

  return {
    settings,
    loading,
    loadError,
    reload: load,
    needsConsent,
    accepting,
    acceptNotice,
    saving,
    setPreference,
    deleteText,
    setDeleteText,
    canDelete: isDeleteConfirmed(deleteText),
    deleting,
    deleteAccount,
  };
}

export type PrivacyViewModel = ReturnType<typeof usePrivacyViewModel>;
