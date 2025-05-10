// components/ui/page-header.
"use client"
import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  backButton?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, description, backButton, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
      <div className="flex items-center">
        {backButton && <div className="mr-4">{backButton}</div>}
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      </div>
      
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}