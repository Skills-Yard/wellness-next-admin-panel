'use client';

import { useCatalogue } from '../../contexts/CatalogueContext';
import CategoriesView from '../../components/catalogue/CategoriesView';
import ServiceDetailView from '../../components/catalogue/ServiceDetailView';
import CategoryModal from '../../components/catalogue/CategoryModal';

export default function CataloguePage() {
    const { activeView } = useCatalogue();

    return (
        <>
            {activeView === 'categories' ? <CategoriesView /> : <ServiceDetailView />}
            <CategoryModal />
        </>
    );
}