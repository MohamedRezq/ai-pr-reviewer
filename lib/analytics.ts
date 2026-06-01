/**
 * PostHog analytics — all tracking calls go through here.
 * Safe to call on the server (no-ops) and before PostHog loads.
 */

type Properties = Record<string, string | number | boolean | null | undefined>

function track(event: string, properties?: Properties) {
  if (typeof window === 'undefined') return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as any).posthog
    if (ph?.capture) ph.capture(event, properties)
  } catch { /* analytics should never crash the app */ }
}

// ─── Acquisition ──────────────────────────────────────────────────────────────

export const analytics = {
  heroCTAClicked: (cta: 'connect_github' | 'try_free') =>
    track('hero_cta_clicked', { cta }),

  toolVisible: () => track('tool_visible'),

  // ─── Activation ─────────────────────────────────────────────────────────

  reviewStarted: (props: {
    entry: 'paste_diff' | 'pr_url' | 'example'
    models: string[]
    isLoggedIn: boolean
  }) => track('review_started', { ...props, models: props.models.join(',') }),

  reviewCompleted: (props: {
    filesReviewed: number
    issuesFound: number
    costUsd: number
    verdict: string
    durationMs: number
    modelsUsed: number
    isFirstEver?: boolean
  }) => {
    track('review_completed', props)
    if (props.isFirstEver) track('first_review_completed', props)
  },

  // ─── Feature usage ───────────────────────────────────────────────────────

  modelSelected: (model: 'single' | 'consensus') =>
    track('model_selected', { model }),

  exampleDiffLoaded: () => track('example_diff_loaded'),

  postToGitHubClicked: (reviewId: string) =>
    track('post_to_github_clicked', { review_id: reviewId }),

  postToGitHubSuccess: (reviewId: string) =>
    track('post_to_github_success', { review_id: reviewId }),

  copyMarkdownClicked: (reviewId?: string) =>
    track('copy_markdown_clicked', { review_id: reviewId }),

  shareReviewClicked: (reviewId: string) =>
    track('share_link_created', { review_id: reviewId }),

  coachingViewed: () => track('coaching_viewed'),

  customRuleAdded: (isFromTemplate: boolean) =>
    track('custom_rule_added', { is_from_template: isFromTemplate }),

  // ─── Conversion ─────────────────────────────────────────────────────────

  signupWallShown: (trigger: 'save_review' | 'pr_url' | 'usage_limit' | 'feature') =>
    track('signup_wall_shown', { trigger }),

  upgradeModalShown: (trigger: 'limit' | 'feature' | 'cta') =>
    track('upgrade_modal_shown', { trigger }),

  upgradeClicked: (plan: 'pro' | 'team') =>
    track('upgrade_clicked', { plan }),

  // ─── User identity ───────────────────────────────────────────────────────

  identify: (userId: string, props: {
    plan: string
    reviewsTotal: number
    githubConnected: boolean
    createdAt: string
  }) => {
    if (typeof window === 'undefined') return
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const ph = (window as any).posthog
      if (ph?.identify) {
        ph.identify(userId, {
          plan: props.plan,
          reviews_total: props.reviewsTotal,
          github_connected: props.githubConnected,
          created_at: props.createdAt,
        })
      }
    } catch { /* ignore */ }
  },
}
