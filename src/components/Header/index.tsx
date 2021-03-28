import Link from 'next/link';

import styles from './header.module.scss';

export default function Header() {
  return (
    <Link href="/">
      <header className={styles.header}>
        <img src="/spacetraveling.svg" alt="logo" />
      </header>
    </Link>
  );
}
