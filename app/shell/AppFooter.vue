<template>
  <footer class="footer">
    <div class="footer-container">
      <!-- Top Row: Community & Support -->
      <div class="footer-main">
        <!-- Community Links -->
        <div class="footer-section">
          <div class="section-label">{{ t('footer.community_label') }}</div>
          <div class="link-group">
            <a
              href="https://discord.gg/zeAP4Ng"
              target="_blank"
              rel="noopener noreferrer"
              class="icon-link icon-link--discord"
              :title="t('footer.call_to_action.discord')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path
                  d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z"
                />
              </svg>
            </a>
            <a
              href="https://github.com/tarkovtracker-org/TarkovTracker"
              target="_blank"
              rel="noopener noreferrer"
              class="icon-link icon-link--github"
              :title="t('footer.call_to_action.github')"
            >
              <UIcon name="i-mdi-github" class="h-5 w-5" />
            </a>
          </div>
        </div>
        <!-- Support Button (Center Focus) -->
        <div class="footer-section support-section">
          <a
            href="https://ko-fi.com/dysektai"
            target="_blank"
            rel="noopener noreferrer"
            class="support-button"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="heart-icon"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
              />
            </svg>
            <span>{{ t('footer.support_button') }}</span>
          </a>
          <p class="support-tagline">{{ t('footer.support_tagline') }}</p>
        </div>
        <!-- Legal Links -->
        <div class="footer-section">
          <div class="section-label">{{ t('footer.legal_label') }}</div>
          <div class="legal-links">
            <router-link to="/terms-of-service" class="text-link">
              {{ t('footer.terms_of_service') }}
            </router-link>
            <span class="divider">·</span>
            <router-link to="/privacy" class="text-link">
              {{ t('footer.privacy_policy') }}
            </router-link>
          </div>
        </div>
      </div>
      <!-- Divider -->
      <div class="footer-divider" />
      <!-- Bottom Row: Copyright & Attribution -->
      <div class="footer-bottom">
        <p class="copyright">TarkovTracker &copy; 2020–{{ new Date().getFullYear() }}</p>
        <p class="attribution">
          {{ t('footer.game_attribution') }}
        </p>
      </div>
    </div>
  </footer>
</template>
<script setup lang="ts">
  import { useI18n } from 'vue-i18n';
  const { t } = useI18n({ useScope: 'global' });
</script>
<style lang="scss" scoped>
  // Brand colors
  $discord-color: #5865f2;
  $discord-hover: #4752c4;
  $github-color: #f0f6fc;
  $github-hover: #c9d1d9;
  .footer {
    position: relative;
    width: 100%;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.3));
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    padding: 1.25rem 1.5rem;
  }
  .footer-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  .footer-main {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 2rem;
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
      gap: 1.25rem;
      text-align: center;
    }
  }
  .footer-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    &:first-child {
      align-items: flex-start;
      @media (max-width: 640px) {
        align-items: center;
      }
    }
    &:last-child {
      align-items: flex-end;
      @media (max-width: 640px) {
        align-items: center;
      }
    }
  }
  .section-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(255, 255, 255, 0.55);
  }
  .link-group {
    display: flex;
    align-items: center;
    gap: 0.625rem;
  }
  .icon-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    &--discord {
      color: $discord-color;
      background: rgba($discord-color, 0.15);
      &:hover {
        color: white;
        background: $discord-hover;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba($discord-color, 0.4);
      }
    }
    &--github {
      color: $github-color;
      background: rgba(255, 255, 255, 0.1);
      &:hover {
        color: #0d1117;
        background: $github-hover;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
      }
    }
  }
  .support-section {
    align-items: center;
  }
  .support-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    color: #ffffff;
    background: var(--color-success-600);
    border: 1px solid var(--color-success-500);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition: all 0.15s ease;
    text-decoration: none;
    .heart-icon {
      color: #ef4444;
    }
    &:hover {
      background: var(--color-success-500);
      border-color: var(--color-success-400);
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }
    &:active {
      transform: translateY(0);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    }
  }
  .support-tagline {
    font-size: 0.8125rem;
    color: rgba(255, 255, 255, 0.65);
    font-style: italic;
    margin: 0.375rem 0 0 0;
  }
  .legal-links {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .text-link {
    font-size: 0.8125rem;
    color: rgb(var(--color-primary-400));
    text-decoration: underline;
    text-decoration-color: rgba(var(--color-primary-400), 0.4);
    text-underline-offset: 2px;
    transition: all 0.2s ease;
    &:hover {
      color: rgb(var(--color-primary-300));
      text-decoration-color: rgb(var(--color-primary-300));
    }
  }
  .divider {
    color: rgba(255, 255, 255, 0.4);
    font-size: 0.875rem;
  }
  .footer-divider {
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(255, 255, 255, 0.1) 20%,
      rgba(255, 255, 255, 0.1) 80%,
      transparent
    );
    margin: 1rem 0;
  }
  .footer-bottom {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }
  .copyright {
    font-size: 0.8125rem;
    font-weight: 600;
    color: #bfbfbf;
    margin: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .attribution {
    font-size: 0.6875rem;
    color: rgba(255, 255, 255, 0.45);
    margin: 0;
    line-height: 1.5;
  }
</style>
