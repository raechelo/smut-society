import { Fragment } from 'react/jsx-runtime';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../ui/breadcrumb';

export const Breadcrumbs = ({
  breadcrumbs,
}: {
  breadcrumbs: { label: string; link?: string }[];
}) => {
  const lastPage = breadcrumbs.pop();

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <Fragment key={breadcrumb.label}>
            <BreadcrumbItem key={index}>
              <BreadcrumbLink href={breadcrumb.link}>
                {breadcrumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage>{lastPage?.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
