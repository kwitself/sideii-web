import Link from 'next/link';

export default function GlobalHeader({homeHref='/',className=''}) {
  return <header className={'nav globalSiteHeader shell '+className}>
    <Link className="brand" href={homeHref} aria-label="SIDE:II home">
      <img src="/brand/sideii-logo-flat.png" alt="SIDE:II"/>
    </Link>
    <nav className="primaryNav" aria-label="Primary navigation">
      <Link href="/#releases">Releases</Link>
      <Link href="/#imprints">Imprints</Link>
      <Link href="/store">Store</Link>
      <Link href="/wear">Wear</Link>
      <div className="navExplore">
        <button type="button" aria-haspopup="true">Explore <span>＋</span></button>
        <div className="navExploreMenu">
          <Link href="/collections">Collections</Link>
          <Link href="/bundles">Bundles</Link>
          <Link href="/artists">Artists</Link>
          <Link href="/credits">Credits</Link>
          <Link href="/timeline">Timeline</Link>
          <Link href="/archive">Archive</Link>
          <Link href="/impact">Impact</Link>
          <Link href="/wholesale">Wholesale</Link>
          <Link href="/policies">Policies</Link>
        </div>
      </div>
      <Link href="/apply" className="navApply">Apply</Link>
    </nav>
  </header>;
}
