import React from 'react';
import { useTheme } from '../context/ThemeContext';
import styles from '../styles/ThemeToggle.module.css';

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div className={styles.themeToggleContainer}>
      <input
        type="checkbox"
        id="theme-toggle"
        className={styles.toggleInput}
        checked={isDarkMode}
        onChange={toggleTheme}
      />
      <label htmlFor="theme-toggle" className={styles.toggleLabel}>
        <div className={styles.toggleSlider}>
          <div className={styles.sunIcon}>
            ☀️
          </div>
          <div className={styles.moonIcon}>
            🌙
          </div>
          <div className={styles.toggleButton}></div>
        </div>
      </label>
    </div>
  );
};

export default ThemeToggle; 