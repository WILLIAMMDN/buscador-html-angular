import { Component, inject } from '@angular/core';
import { LucideBarChart3, LucideBookOpenText, LucideBrain, LucidePanelTop } from '@lucide/angular';
import { ImportPanelComponent } from './components/import-panel/import-panel.component';
import { InsightsComponent } from './components/insights/insights.component';
import { PracticeComponent } from './components/practice/practice.component';
import { ReaderComponent } from './components/reader/reader.component';
import { ResultListComponent } from './components/result-list/result-list.component';
import { SearchPanelComponent } from './components/search-panel/search-panel.component';
import { StatsPanelComponent } from './components/stats-panel/stats-panel.component';
import { AppView } from './models/library.models';
import { LibraryStoreService } from './services/library-store.service';

@Component({
  selector: 'app-root',
  imports: [
    ImportPanelComponent,
    InsightsComponent,
    LucideBarChart3,
    LucideBookOpenText,
    LucideBrain,
    LucidePanelTop,
    PracticeComponent,
    ReaderComponent,
    ResultListComponent,
    SearchPanelComponent,
    StatsPanelComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly store = inject(LibraryStoreService);

  setView(view: AppView): void {
    this.store.setView(view);
  }
}
