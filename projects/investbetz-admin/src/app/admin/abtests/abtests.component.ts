import { Component, OnInit, inject } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AbTestExperiment } from '../services';
import { AdminAbtestsStore } from './stores';

@Component({
  selector: 'app-abtests',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './abtests.component.html',
  styleUrls: ['./abtests.component.scss']
})
export class AbtestsComponent implements OnInit {
  readonly store = inject(AdminAbtestsStore);

  showForm = false;
  editingKey: string | null = null;
  form = { key: '', description: '', enabled: true, controlShare: 50 };

  ngOnInit() {
    this.store.load();
  }

  startCreate() {
    this.editingKey = null;
    this.form = { key: '', description: '', enabled: true, controlShare: 50 };
    this.showForm = true;
  }

  startEdit(exp: AbTestExperiment) {
    this.editingKey = exp.key;
    this.form = {
      key: exp.key,
      description: exp.description || '',
      enabled: exp.enabled,
      controlShare: exp.controlShare,
    };
    this.showForm = true;
  }

  cancelForm() {
    this.showForm = false;
    this.editingKey = null;
  }

  save() {
    if (!this.form.key.trim()) return;
    this.store.save(this.form.key, this.form.description, this.form.enabled, this.form.controlShare);
    this.showForm = false;
    this.editingKey = null;
  }

  toggle(exp: AbTestExperiment) {
    this.store.toggle(exp.key, !exp.enabled);
  }

  analyze(key: string) {
    this.store.analyze(key);
  }

  eventTotal(key: string): number {
    const summary = this.store.summary();
    if (!summary || summary.experiment?.key !== key) return 0;
    return summary.users.control + summary.users.treatment;
  }

  controlPct(key: string): number {
    const summary = this.store.summary();
    if (!summary || summary.experiment?.key !== key) return 0;
    const total = summary.users.control + summary.users.treatment;
    if (total === 0) return 0;
    return Math.round((summary.users.control / total) * 100);
  }

  isAnalyzed(key: string): boolean {
    const summary = this.store.summary();
    return !!summary && summary.experiment?.key === key;
  }

  trackByKey(_: number, exp: AbTestExperiment) { return exp.key; }
}