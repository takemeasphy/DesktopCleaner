import React, { useMemo } from "react";
import { MiniBarChart, type MiniBarDatum } from "../components/MiniBarChart";
import "./css-styles/ProfilePage.css";

type ProfileSummary = {
    version?: number;
    total_records?: number;
    labeled_records?: number;
    categorized_records?: number;
    labels?: Record<string, number>;
    categories?: Record<string, number>;
    top_label?: string | null;
    top_category?: string | null;
    error?: string;
};

type ProfilePageProps = {
    t: any;
    onClose: () => void;

    summary?: ProfileSummary | null;
    files?: any[]; // fallback якщо summary немає
};

function normalizeMapToChartData(map?: Record<string, number>): MiniBarDatum[] {
    if (!map) return [];
    return Object.entries(map)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
}

function safeKey(x: unknown): string {
    if (typeof x !== "string") return "none";
    return x.trim() ? x : "none";
}

function prettyLabel(x: string): string {
    if (x === "none") return "—";
    if (x === "trash") return "Trash";
    if (x === "keep") return "Keep";
    if (x === "pinned") return "Pinned";
    if (x === "organize") return "Organize";
    return x;
}

function prettyCategory(x: string): string {
    if (x === "none") return "—";
    if (x === "study") return "Study";
    if (x === "work") return "Work";
    if (x === "personal") return "Personal";
    if (x === "games") return "Games";
    return x;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ t, onClose, summary, files }) => {
    // Fallback: якщо summary немає — рахуємо по поточних files (видимі зараз)
    const fallback = useMemo(() => {
        const labels: Record<string, number> = {};
        const categories: Record<string, number> = {};

        const arr = Array.isArray(files) ? files : [];
        for (const f of arr) {
            const l = safeKey((f as any).user_label ?? "none");
            const c = safeKey((f as any).user_category ?? "none");
            labels[l] = (labels[l] ?? 0) + 1;
            categories[c] = (categories[c] ?? 0) + 1;
        }

        const total = arr.length;
        const labeled = Object.entries(labels)
            .filter(([k]) => k !== "none")
            .reduce((s, [, v]) => s + v, 0);

        const categorized = Object.entries(categories)
            .filter(([k]) => k !== "none")
            .reduce((s, [, v]) => s + v, 0);

        const topLabel = Object.entries(labels).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";
        const topCat = Object.entries(categories).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "none";

        return {
            total_records: total,
            labeled_records: labeled,
            categorized_records: categorized,
            labels,
            categories,
            top_label: topLabel,
            top_category: topCat,
        } as ProfileSummary;
    }, [files]);

    const data: ProfileSummary = summary ?? fallback;

    const total = typeof data.total_records === "number" ? data.total_records : 0;
    const labeled = typeof data.labeled_records === "number" ? data.labeled_records : 0;
    const categorized = typeof data.categorized_records === "number" ? data.categorized_records : 0;

    const labeledPct = total > 0 ? Math.round((labeled / total) * 100) : 0;
    const categorizedPct = total > 0 ? Math.round((categorized / total) * 100) : 0;

    const labelsChart = normalizeMapToChartData(data.labels);
    const categoriesChart = normalizeMapToChartData(data.categories);

    return (
        <div className="settings-page">
            <div className="settings-card profile-card">
                {/* Header row: БЕЗ іконки біля стрілки */}
                <div className="settings-header-row profile-header-row">
                    <button type="button" className="settings-back-btn" onClick={onClose} aria-label="Back">
                        ←
                    </button>

                    <div className="settings-header-text">
                        <div className="settings-title">{t?.profileTitle ?? "Profile"}</div>
                        <div className="settings-subtitle">
                            {t?.profileSubtitle ?? "Your labeling & categories overview (from state history)"}
                        </div>
                    </div>
                </div>

                <div className="settings-section profile-section">
                    {data.error && <div className="profile-error">{data.error}</div>}

                    {/* Великий блок “аватар” по центру */}
                    <div className="profile-avatar-block" aria-hidden="true">
                        <div className="profile-avatar-ring">
                            <div className="profile-avatar">
                                <svg width="46" height="46" viewBox="0 0 24 24" fill="none">
                                    <path
                                        d="M12 12a4.5 4.5 0 1 0-4.5-4.5A4.51 4.51 0 0 0 12 12Z"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                    />
                                    <path
                                        d="M4.5 20.5c1.6-4 13.4-4 15 0"
                                        stroke="currentColor"
                                        strokeWidth="1.7"
                                        strokeLinecap="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* 4 блоки статистики: 2 зліва, 2 справа */}
                    <div className="profile-metrics-2x2">
                        <div className="profile-metric">
                            <div className="profile-metric-label">{t?.profileTotalSeen ?? "Total seen files (history)"}</div>
                            <div className="profile-metric-value">{total}</div>
                            <div className="profile-metric-sub">{t?.profileTotalSeenSub ?? "Records stored in state"}</div>
                        </div>

                        <div className="profile-metric">
                            <div className="profile-metric-label">{t?.profileLabeled ?? "Labeled"}</div>
                            <div className="profile-metric-value">
                                {labeled} <span className="profile-metric-muted">({labeledPct}%)</span>
                            </div>
                            <div className="profile-metric-sub">{t?.profileLabeledSub ?? "user_label != none"}</div>
                        </div>

                        <div className="profile-metric">
                            <div className="profile-metric-label">{t?.profileCategorized ?? "Categorized"}</div>
                            <div className="profile-metric-value">
                                {categorized} <span className="profile-metric-muted">({categorizedPct}%)</span>
                            </div>
                            <div className="profile-metric-sub">{t?.profileCategorizedSub ?? "user_category != none"}</div>
                        </div>

                        <div className="profile-metric">
                            <div className="profile-metric-label">{t?.profileTop ?? "Top signals"}</div>
                            <div className="profile-top-lines">
                                <div>
                                    {t?.profileTopLabel ?? "Label"}: <b>{prettyLabel(safeKey(data.top_label ?? "none"))}</b>
                                </div>
                                <div>
                                    {t?.profileTopCategory ?? "Category"}: <b>{prettyCategory(safeKey(data.top_category ?? "none"))}</b>
                                </div>
                            </div>
                            <div className="profile-metric-sub">{t?.profileTopSub ?? "Most common in history"}</div>
                        </div>
                    </div>

                    {/* Нижче — графіки (залишив, бо корисно; якщо не треба — скажеш і прибираємо) */}
                    <div className="profile-charts-grid">
                        <div className="profile-chart-card">
                            <div className="profile-chart-title">{t?.profileLabelsChart ?? "Labels distribution"}</div>
                            {labelsChart.length ? (
                                <MiniBarChart data={labelsChart} />
                            ) : (
                                <div className="profile-empty">No labels yet</div>
                            )}
                        </div>

                        <div className="profile-chart-card">
                            <div className="profile-chart-title">{t?.profileCategoriesChart ?? "Categories distribution"}</div>
                            {categoriesChart.length ? (
                                <MiniBarChart data={categoriesChart} />
                            ) : (
                                <div className="profile-empty">No categories yet</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
