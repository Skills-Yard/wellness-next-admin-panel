'use client';

import React, { createContext, useContext, useState } from 'react';

// Lets a page deep in the tree (e.g. the partner detail page) hand Header a human-readable
// label for the current route once it's loaded the entity the URL's id refers to — Header
// itself only ever sees the raw pathname, so without this it has no way to turn
// `/partners/<id>` into anything but the id itself. Same idea as CatalogueContext's
// selectedSubCategory, just generic enough for any "detail page sets its own breadcrumb tail"
// case instead of being catalogue-specific.
interface BreadcrumbContextType {
  label: string | null;
  setLabel: (label: string | null) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(undefined);

export const BreadcrumbProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [label, setLabel] = useState<string | null>(null);
  return (
    <BreadcrumbContext.Provider value={{ label, setLabel }}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

export const useBreadcrumb = () => {
  const ctx = useContext(BreadcrumbContext);
  if (!ctx) throw new Error('useBreadcrumb must be used within a BreadcrumbProvider');
  return ctx;
};
