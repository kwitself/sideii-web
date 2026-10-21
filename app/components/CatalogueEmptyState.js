import Link from 'next/link';
export default function CatalogueEmptyState({label='CATALOGUE / IN PREPARATION',title,children,href='/store',action='EXPLORE THE STORE →'}){
 return <div className="catalogueEmptyState"><small>{label}</small><h2>{title}</h2><p>{children}</p><Link href={href}>{action}</Link></div>;
}
