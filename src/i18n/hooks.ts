import { useTranslations } from "next-intl";
import { useI18n } from "./provider";

export const useLocalizedTranslations = () => {
  const t = useTranslations();
  const { locale, setLocale } = useI18n();

  return {
    t,
    locale,
    setLocale,
    // Helper function for common translations
    common: {
      next: () => t("common.next"),
      back: () => t("common.back"),
      save: () => t("common.save"),
      cancel: () => t("common.cancel"),
      delete: () => t("common.delete"),
      edit: () => t("common.edit"),
      close: () => t("common.close"),
      confirm: () => t("common.confirm"),
      loading: () => t("common.loading"),
      error: () => t("common.error"),
      success: () => t("common.success"),
    },
    // Helper function for navigation translations
    navigation: {
      stage1: () => t("navigation.stage1"),
      stage2: () => t("navigation.stage2"),
      stage3: () => t("navigation.stage3"),
    },
    // Helper function for stage translations
    stages: {
      stage1: {
        title: () => t("stage1.title"),
        description: () => t("stage1.description"),
        addActivity: () => t("stage1.addActivity"),
        activityType: () => t("stage1.activityType"),
        quantity: () => t("stage1.quantity"),
        unit: () => t("stage1.unit"),
        date: () => t("stage1.date"),
        notes: () => t("stage1.notes"),
      },
      stage2: {
        title: () => t("stage2.title"),
        description: () => t("stage2.description"),
        addEmissionFactor: () => t("stage2.addEmissionFactor"),
        factorName: () => t("stage2.factorName"),
        factorValue: () => t("stage2.factorValue"),
        unit: () => t("stage2.unit"),
      },
      stage3: {
        title: () => t("stage3.title"),
        description: () => t("stage3.description"),
        totalEmissions: () => t("stage3.totalEmissions"),
        breakdown: () => t("stage3.breakdown"),
        charts: () => t("stage3.charts"),
      },
    },
  };
};
