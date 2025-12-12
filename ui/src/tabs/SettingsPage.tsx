import React from "react";
import "./css-styles/SettingsPage.css";

interface SettingsPageProps {
  t: any;
  ignoreList: string[];
  cleanupThreshold: number;
  onChangeThreshold: (value: number) => void;
  onClose: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  t,
  ignoreList,
  cleanupThreshold,
  onChangeThreshold,
  onClose,
}) => {
  return (
    <div className="settings-page">
      <div className="settings-card">
        <div className="settings-header-row">
          <button
            type="button"
            className="settings-back-btn"
            onClick={onClose}
          >
            ←
          </button>
          <div className="settings-header-text">
            <div className="settings-title">{t.settingsLabel}</div>
            <div className="settings-subtitle">{t.settingsSubtitle}</div>
          </div>
        </div>

        <div className="settings-section settings-main-row">
          <div className="settings-column">
            <label className="settings-row">
              <input type="checkbox" className="settings-checkbox" />
              <div className="settings-row-text">
                <div className="settings-row-title">
                  {t.settingsAutoLaunchTitle}
                </div>
                <div className="settings-row-desc">
                  {t.settingsAutoLaunchDesc}
                </div>
              </div>
            </label>

            <label className="settings-row">
              <input type="checkbox" className="settings-checkbox" />
              <div className="settings-row-text">
                <div className="settings-row-title">
                  {t.settingsHiddenFilesTitle}
                </div>
                <div className="settings-row-desc">
                  {t.settingsHiddenFilesDesc}
                </div>
              </div>
            </label>

            <label className="settings-row">
              <input type="checkbox" className="settings-checkbox" />
              <div className="settings-row-text">
                <div className="settings-row-title">
                  {t.settingsDryRunTitle}
                </div>
                <div className="settings-row-desc">
                  {t.settingsDryRunDesc}
                </div>
              </div>
            </label>
          </div>

          <div className="settings-ignore-card">
            <div className="settings-ignore-header">
              <div className="settings-row-title">
                {t.settingsIgnoreListTitle}
              </div>
              <div className="settings-row-desc">
                {t.settingsIgnoreListDesc}
              </div>
            </div>
            <button
              type="button"
              className="settings-btn-secondary settings-ignore-button"
            >
              {t.settingsIgnoreListButton}
            </button>
            <div className="settings-ignore-list">
              {ignoreList.length === 0 ? (
                <div className="settings-ignore-item settings-ignore-empty">
                  {t.settingsIgnoreListEmpty}
                </div>
              ) : (
                ignoreList.slice(0, 4).map((item) => (
                  <div key={item} className="settings-ignore-item">
                    {item}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="settings-row-text">
            <div className="settings-row-title">
              {t.settingsThresholdTitle}
            </div>
            <div className="settings-row-desc">
              {t.settingsThresholdDesc}
            </div>
          </div>
          <div className="settings-range-wrapper">
            <input
              type="range"
              min={7}
              max={90}
              value={cleanupThreshold}
              onChange={(e) => onChangeThreshold(Number(e.target.value))}
            />
            <div className="settings-range-value">
              {cleanupThreshold} {t.settingsThresholdSuffix}
            </div>
          </div>
        </div>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-btn-secondary"
            onClick={onClose}
          >
            {t.settingsCancel}
          </button>
          <button
            type="button"
            className="settings-btn-primary"
            onClick={onClose}
          >
            {t.settingsSave}
          </button>
        </div>
      </div>
    </div>
  );
};
