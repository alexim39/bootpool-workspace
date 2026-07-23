import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { NgFor, NgIf, DatePipe, DecimalPipe } from '@angular/common';
import { AdminPod } from '../services';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { PodFormComponent } from './pod-form.component';
import { AdminPodsStore } from './stores/admin-pods.store';

@Component({
  selector: 'app-pods',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, DecimalPipe, FormsModule,
    MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatPaginatorModule, MatCheckboxModule,
    PodFormComponent],
  templateUrl: './pods.component.html',
  styles: [`
    .pods-page { max-width: 1400px; }
    .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; gap: 16px; flex-wrap: wrap; }
    .page-header-left { display: flex; align-items: center; gap: 20px; }
    .page-header h1 { color: #fff; font-size: 24px; font-weight: 600; margin: 0; }
    .header-actions { display: flex; gap: 10px; }
    .btn-create { background: #00E676 !important; color: #0A1428 !important; font-weight: 600; }
    .btn-sync { color: #90caf9 !important; border-color: #90caf9 !important; }
    .btn-settle-all { color: #81D4FA !important; border-color: #81D4FA !important; }
    .stat-group { display: flex; gap: 8px; flex-wrap: wrap; }
    .stat-item { font-size: 12px; font-weight: 500; padding: 4px 12px; border-radius: 20px; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.7); }
    .stat-item.draft-dot { border-left: 3px solid #555; }
    .stat-item.pub-dot { border-left: 3px solid #E8B923; }
    .stat-item.act-dot { border-left: 3px solid #00E676; }
    .stat-item.past-dot { border-left: 3px solid rgba(255,255,255,0.2); }
    .filter-bar { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); margin-bottom: 16px; padding: 0; overflow: hidden; }
    .tabs { display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .tab-btn { display: flex; align-items: center; gap: 6px; padding: 12px 20px; background: none; border: none; color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
    .tab-btn:hover { color: rgba(255,255,255,0.8); background: rgba(255,255,255,0.03); }
    .tab-btn.active { color: #00E676; border-bottom-color: #00E676; background: rgba(0,230,118,0.04); }
    .tab-btn mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .tab-badge { background: rgba(0,230,118,0.15); color: #00E676; font-size: 11px; font-weight: 700; padding: 1px 7px; border-radius: 10px; margin-left: 2px; }
    .tab-badge.warn { background: rgba(232,185,35,0.15); color: #E8B923; }
    .filter-controls { display: flex; align-items: center; gap: 12px; padding: 10px 16px; }
    .search-wrapper { flex: 1; display: flex; align-items: center; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 0 12px; max-width: 320px; }
    .search-icon { font-size: 18px; color: rgba(255,255,255,0.3); }
    .search-input { background: none; border: none; color: #fff; padding: 8px 8px; font-size: 13px; outline: none; width: 100%; }
    .search-input::placeholder { color: rgba(255,255,255,0.3); }
    .date-range { display: flex; align-items: center; gap: 4px; }
    .date-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; padding: 5px 8px; font-size: 12px; font-family: inherit; outline: none; width: 130px; color-scheme: dark; }
    .date-input::-webkit-calendar-picker-indicator { filter: invert(0.7); cursor: pointer; }
    .date-sep { color: rgba(255,255,255,0.3); font-size: 13px; }
    .date-clear { background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; font-size: 14px; padding: 2px 6px; border-radius: 4px; line-height: 1; }
    .date-clear:hover { color: #f44336; background: rgba(244,67,54,0.1); }
    .sub-filters { display: flex; gap: 4px; flex-wrap: wrap; }
    .sub-chip { background: none; border: none; color: rgba(255,255,255,0.4); font-size: 12px; padding: 4px 10px; border-radius: 16px; cursor: pointer; transition: all 0.15s; font-weight: 500; }
    .sub-chip:hover { color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.05); }
    .sub-chip.active { color: #fff; background: rgba(255,255,255,0.1); }
    .sub-chip.draft.active { background: rgba(85,85,85,0.3); color: #ccc; }
    .sub-chip.published.active { background: rgba(232,185,35,0.2); color: #E8B923; }
    .sub-chip.active.active { background: rgba(0,230,118,0.15); color: #00E676; }
    .sub-chip.settled.active { background: rgba(33,150,243,0.15); color: #2196f3; }
    .sub-chip.cancelled.active { background: rgba(244,67,54,0.15); color: #f44336; }
    .table-card { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.06); position: relative; }
    .admin-table { width: 100%; }
    ::ng-deep .admin-table .mat-mdc-header-cell { color: rgba(255,255,255,0.45) !important; font-size: 11px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.5px; border-bottom-color: rgba(255,255,255,0.06) !important; background: transparent !important; padding: 12px 12px !important; }
    ::ng-deep .admin-table .mat-mdc-cell { color: rgba(255,255,255,0.85) !important; font-size: 13px !important; border-bottom-color: rgba(255,255,255,0.04) !important; background: transparent !important; padding: 10px 12px !important; }
    ::ng-deep .mat-mdc-paginator { background: transparent !important; color: rgba(255,255,255,0.7) !important; border-top: 1px solid rgba(255,255,255,0.06); }
    ::ng-deep .mat-mdc-paginator .mat-mdc-paginator-navigation-button { color: rgba(255,255,255,0.6) !important; }
    ::ng-deep .mat-mdc-paginator .mat-mdc-select-value-text { color: rgba(255,255,255,0.7) !important; }
    .clickable-row { cursor: pointer; transition: background 0.15s; }
    .clickable-row.active-row:hover { background: rgba(0,230,118,0.04) !important; }
    .clickable-row.past-row { opacity: 0.6; }
    .clickable-row.past-row:hover { opacity: 0.85; background: rgba(255,255,255,0.02) !important; }
    .chip { padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; color: #fff; text-transform: capitalize; display: inline-block; }
    .chip.settlement { font-size: 10px; padding: 1px 7px; }
    .empty-state { padding: 48px 32px; text-align: center; color: rgba(255,255,255,0.3); font-size: 14px; display: flex; flex-direction: column; align-items: center; }
    .loading-shim { position: absolute; inset: 0; background: rgba(10,20,40,0.6); z-index: 10; display: flex; align-items: center; justify-content: center; border-radius: 12px; }
    .spinner { width: 32px; height: 32px; border: 3px solid rgba(0,230,118,0.2); border-top-color: #00E676; border-radius: 50%; animation: spin 0.7s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .match-cell { display: flex; flex-direction: column; gap: 2px; }
    .match-teams { color: #fff; font-size: 13px; font-weight: 500; }
    .match-date { color: rgba(255,255,255,0.35); font-size: 11px; }
    .status-group { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
    .live-pill { font-size: 9px; font-weight: 700; padding: 1px 6px; border-radius: 3px; background: rgba(244,67,54,0.2); color: #f44336; animation: pulse-live 1.5s ease-in-out infinite; text-transform: uppercase; }
    @keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .pick-value { color: #00E676; font-weight: 600; }
    .pick-odds { color: #E8B923; font-size: 12px; font-weight: 600; margin-left: 8px; }
    .exposure-cell { display: flex; flex-direction: column; gap: 4px; min-width: 140px; }
    .exposure-amount { font-size: 12px; color: rgba(255,255,255,0.7); }
    .exposure-track { height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden; width: 100%; max-width: 140px; }
    .exposure-fill { height: 100%; border-radius: 2px; transition: width 0.3s; }
    .range-cell { color: rgba(255,255,255,0.55) !important; font-size: 12px !important; }
    .row-actions { display: flex; gap: 2px; align-items: center; }
    ::ng-deep .row-actions .mat-mdc-icon-button { width: 32px; height: 32px; padding: 0; display: inline-flex; align-items: center; justify-content: center; }
    ::ng-deep .row-actions .mat-mdc-icon-button .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .pod-detail-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; overflow: hidden; }
    .panel-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .panel-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .panel-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .panel-header-meta { display: flex; gap: 6px; margin-left: auto; }
    .panel-header button { color: rgba(255,255,255,0.5); }
    .panel-body { padding: 16px 20px; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 16px; }
    .detail-item { display: flex; flex-direction: column; gap: 4px; }
    .detail-item .label { font-size: 11px; color: rgba(255,255,255,0.4); text-transform: uppercase; font-weight: 600; }
    .detail-item .value { font-size: 15px; color: #fff; font-weight: 500; }
    .exposure-bar-bg { width: 100%; max-width: 120px; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
    .exposure-bar-fill { height: 100%; border-radius: 3px; transition: width 0.3s; }
    .confidence-badge { padding: 2px 10px; border-radius: 10px; font-size: 13px; font-weight: 700; }
    .detail-actions { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .action-publish { color: #00E676 !important; border-color: #00E676 !important; }
    .action-activate { color: #E8B923 !important; border-color: #E8B923 !important; }
    .action-settle { color: #2196f3 !important; border-color: #2196f3 !important; }
    .action-cancel { color: #f44336 !important; border-color: #f44336 !important; }
    .settle-form { margin: 12px 0; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 8px; }
    .settle-form h4 { color: #fff; margin: 0 0 8px; font-size: 14px; }
    .settle-actions { display: flex; gap: 8px; }
    .btn-loss { background: #f44336 !important; }
    .btn-void { background: #666 !important; }
    .legs-list h4 { color: #fff; font-size: 14px; margin: 12px 0 8px; }
    .leg-item { display: flex; align-items: center; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .leg-num { width: 24px; height: 24px; border-radius: 50%; background: rgba(0,230,118,0.15); color: #00E676; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .leg-teams { color: #fff; font-size: 13px; flex: 1; }
    .leg-date { color: rgba(255,255,255,0.4); font-size: 12px; }
    .sync-result { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; overflow: hidden; }
    .sync-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; }
    .sync-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .sync-details { padding: 8px 16px 12px; }
    .sync-error { color: #f44336; font-size: 12px; padding: 2px 0; }
    .sync-log { color: rgba(255,255,255,0.5); font-size: 11px; padding: 1px 0; font-family: monospace; }
    .sync-section-label { color: rgba(255,255,255,0.3); font-size: 10px; text-transform: uppercase; font-weight: 600; margin: 8px 0 4px; letter-spacing: 1px; }
    .sync-success-item { color: rgba(255,255,255,0.7); font-size: 12px; padding: 2px 0; }
    .sync-more { color: rgba(255,255,255,0.4); font-size: 12px; padding: 2px 0; font-style: italic; }
    .btn-curate { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .curation-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(206,147,216,0.25); margin-bottom: 16px; overflow: hidden; }
    .curation-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; flex-wrap: wrap; }
    .curation-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .ora-stats { color: rgba(255,255,255,0.5); font-size: 12px; font-weight: 400; }
    .combined-info { padding: 6px 12px; margin: 4px 0; background: rgba(206,147,216,0.08); border-radius: 6px; font-size: 12px; color: #CE93D8; }
    .combined-label { font-weight: 500; }
    .curation-body { padding: 8px 16px 12px; max-height: 600px; overflow-y: auto; }
    .curation-log-entry { color: rgba(255,255,255,0.4); font-size: 11px; padding: 1px 0; font-family: monospace; }
    .curation-error { color: #f44336; font-size: 12px; padding: 2px 0; }
    .curation-fixtures { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .curation-fixture { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 12px; border: 1px solid rgba(255,255,255,0.06); }
    .fixture-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
    .fixture-teams { color: #fff; font-size: 14px; font-weight: 500; }
    .fixture-league { color: rgba(255,255,255,0.4); font-size: 11px; text-transform: uppercase; }
    .fixture-verdict { font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 2px 8px; border-radius: 4px; margin-left: auto; }
    .fixture-verdict.recommend { background: rgba(0,230,118,0.15); color: #00E676; }
    .fixture-verdict.skip { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
    .fixture-body { margin-top: 8px; }
    .recommendation-row { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 12px; flex-wrap: wrap; }
    .rec-selection { color: #fff; font-weight: 500; min-width: 80px; }
    .rec-confidence { color: rgba(255,255,255,0.7); min-width: 120px; display: flex; align-items: center; gap: 6px; }
    .confidence-bar { height: 6px; border-radius: 3px; width: 60px; display: inline-block; }
    .rec-multiplier { color: #CE93D8; font-weight: 600; min-width: 40px; }
    .rec-reasoning { color: rgba(255,255,255,0.5); font-size: 11px; flex: 1; min-width: 120px; }
    .fixture-action { margin-top: 8px; }
    .btn-create-from-curation { color: #CE93D8 !important; border-color: #CE93D8 !important; font-size: 12px !important; }
    .fixture-skip-reason { color: rgba(255,255,255,0.35); font-size: 11px; font-style: italic; }
    .action-ai-settle { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .action-settle-all { color: #CE93D8 !important; border-color: #CE93D8 !important; }
    .btn-settle-all { color: #81D4FA !important; border-color: #81D4FA !important; }
    .disputed-badge { background: #E8B923; color: #0A1428; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 8px; margin-left: 8px; }
    .settle-item-verdict.disputed { background: rgba(232,185,35,0.15); color: #E8B923; padding: 1px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .btn-dispute-review { color: #E8B923 !important; border-color: #E8B923 !important; margin-top: 8px; }
    .disputed-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(232,185,35,0.3); margin-bottom: 16px; overflow: hidden; }
    .disputed-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; }
    .disputed-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .disputed-body { padding: 8px 16px 12px; max-height: 400px; overflow-y: auto; }
    .disputed-empty { color: rgba(255,255,255,0.3); font-size: 13px; padding: 16px; text-align: center; }
    .disputed-item { background: rgba(232,185,35,0.05); border: 1px solid rgba(232,185,35,0.15); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .disputed-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px; }
    .disputed-teams { color: #fff; font-size: 14px; font-weight: 500; }
    .disputed-selection { color: rgba(255,255,255,0.5); font-size: 12px; }
    .disputed-reason { color: #E8B923; font-size: 12px; margin-bottom: 8px; line-height: 1.4; }
    .disputed-actions { display: flex; gap: 8px; }
    .btn-resolve { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .stuck-badge { background: #90CAF9; color: #0A1428; font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 8px; margin-left: 8px; }
    .settle-item-verdict.stuck { background: rgba(144,202,249,0.15); color: #90CAF9; padding: 1px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
    .btn-stuck-review { color: #90CAF9 !important; border-color: #90CAF9 !important; margin-top: 8px; margin-left: 8px; }
    .stuck-panel { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(144,202,249,0.3); margin-bottom: 16px; overflow: hidden; }
    .stuck-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; font-weight: 500; }
    .stuck-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .stuck-body { padding: 8px 16px 12px; max-height: 400px; overflow-y: auto; }
    .stuck-empty { color: rgba(255,255,255,0.3); font-size: 13px; padding: 16px; text-align: center; }
    .stuck-item { background: rgba(144,202,249,0.05); border: 1px solid rgba(144,202,249,0.15); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
    .stuck-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; flex-wrap: wrap; gap: 4px; }
    .stuck-teams { color: #fff; font-size: 14px; font-weight: 500; }
    .stuck-selection { color: rgba(255,255,255,0.5); font-size: 12px; }
    .stuck-reason { color: #90CAF9; font-size: 12px; margin-bottom: 8px; line-height: 1.4; }
    .stuck-actions { display: flex; gap: 8px; }
    .btn-settle-manual { color: #90CAF9 !important; border-color: #90CAF9 !important; font-size: 12px !important; }
    .disputed-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .btn-batch-resolve { color: #00E676 !important; border-color: #00E676 !important; font-size: 12px !important; }
    .disputed-item.selected { background: rgba(0,230,118,0.08); border-color: #00E676; }
    .disputed-checkbox { margin-right: 8px; }
    ::ng-deep .disputed-checkbox .mat-mdc-checkbox-touch-target { width: 20px; height: 20px; }
    ::ng-deep .disputed-checkbox.mdc-checkbox .mdc-checkbox__native-control { width: 20px; height: 20px; }
    .resolve-info { color: rgba(255,255,255,0.6); font-size: 13px; margin: 0 0 8px; }
    .resolve-modal { position: fixed; inset: 0; z-index: 1100; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .resolve-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); }
    .resolve-card { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 480px; border: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 1; }
    .resolve-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
    .resolve-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; }
    .resolve-header button { color: rgba(255,255,255,0.5); }
    .resolve-body { padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
    .resolve-pod-title { color: #fff; font-size: 15px; font-weight: 500; margin: 0; }
    .resolve-dispute-reason { color: #E8B923; font-size: 12px; margin: 0; }
    .resolve-actions { display: flex; justify-content: flex-end; gap: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.06); }
    .ai-settle-panel { background: rgba(206,147,216,0.08); border: 1px solid rgba(206,147,216,0.2); border-radius: 8px; margin: 12px 0; overflow: hidden; }
    .ai-settle-header { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 13px; font-weight: 500; }
    .ai-settle-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .ai-settle-body { padding: 12px 14px; }
    .ai-settle-result { margin-bottom: 8px; }
    .score-row { color: #fff; font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .score-row strong { color: #00E676; font-size: 20px; }
    .status-row { color: rgba(255,255,255,0.5); font-size: 12px; margin-bottom: 8px; }
    .match-status { text-transform: capitalize; }
    .no-data { color: rgba(255,255,255,0.4); font-size: 12px; }
    .verdict-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .verdict-label { color: rgba(255,255,255,0.5); font-size: 12px; }
    .verdict-value { font-size: 14px; font-weight: 700; padding: 2px 10px; border-radius: 4px; }
    .verdict-value.win { background: rgba(0,230,118,0.15); color: #00E676; }
    .verdict-value.loss { background: rgba(244,67,54,0.15); color: #f44336; }
    .verdict-value.void { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.6); }
    .verdict-value.unknown { background: rgba(255,152,0,0.15); color: #FF9800; }
    .verdict-confidence { color: rgba(255,255,255,0.4); font-size: 11px; }
    .reasoning-row { color: rgba(255,255,255,0.6); font-size: 12px; margin-bottom: 10px; line-height: 1.4; }
    .settle-actions { display: flex; gap: 8px; }
    .settle-all-panel { background: rgba(129,212,250,0.08); border: 1px solid rgba(129,212,250,0.2); border-radius: 12px; margin-bottom: 16px; overflow: hidden; }
    .settle-all-header { display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.06); color: #fff; font-size: 14px; }
    .settle-all-header button { margin-left: auto; color: rgba(255,255,255,0.4); }
    .settle-all-body { padding: 8px 16px 12px; max-height: 400px; overflow-y: auto; }
    .settle-all-error { color: #f44336; font-size: 12px; padding: 2px 0; }
    .settle-all-item { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
    .settle-item-teams { color: rgba(255,255,255,0.7); font-size: 12px; }
    .settle-item-verdict { font-size: 11px; font-weight: 700; padding: 1px 8px; border-radius: 3px; }
    .settle-item-verdict.win { color: #00E676; }
    .settle-item-verdict.loss { color: #f44336; }
    .settle-item-verdict.unknown { color: #FF9800; }
    .settle-more { color: rgba(255,255,255,0.3); font-size: 11px; padding: 4px 0; font-style: italic; }
    .reserve-bar { background: #0D1A30; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); margin-bottom: 16px; padding: 16px 20px; }
    .reserve-header { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
    .reserve-title { display: flex; align-items: center; gap: 8px; color: #fff; font-size: 14px; font-weight: 600; }
    .reserve-amount { color: #E8B923; font-size: 16px; font-weight: 700; margin-left: auto; }
    .reserve-stats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 12px; color: rgba(255,255,255,0.6); }
    .stat-divider { color: rgba(255,255,255,0.15); }
    .text-green { color: #00E676; }
    .text-red { color: #f44336; }
    .net-badge { font-size: 10px; padding: 1px 6px; border-radius: 6px; margin-left: 4px; font-weight: 600; }
    .net-badge.positive { background: rgba(0,230,118,0.12); color: #00E676; }
    .net-badge.negative { background: rgba(244,67,54,0.12); color: #f44336; }
    .reserve-bar-track { height: 20px; background: rgba(255,255,255,0.06); border-radius: 10px; overflow: hidden; position: relative; }
    .reserve-bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s ease; display: flex; align-items: center; justify-content: center; min-width: 0; }
    .reserve-bar-fill.safe { background: linear-gradient(90deg, #00E676, #00C853); }
    .reserve-bar-fill.warning { background: linear-gradient(90deg, #E8B923, #FFA000); }
    .reserve-bar-fill.danger { background: linear-gradient(90deg, #f44336, #D32F2F); }
    .bar-label { color: #fff; font-size: 11px; font-weight: 700; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }
    .reserve-bar-ticks { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10px; color: rgba(255,255,255,0.25); padding: 0 2px; }
    .detail-dialog { position: fixed; inset: 0; z-index: 1200; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .detail-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.7); }
    .detail-dialog-card { background: #0D1A30; border-radius: 12px; width: 100%; max-width: 600px; max-height: 85vh; border: 1px solid rgba(255,255,255,0.08); position: relative; z-index: 1; display: flex; flex-direction: column; overflow: hidden; }
    .detail-dialog-header { display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); flex-shrink: 0; }
    .detail-dialog-header h3 { color: #fff; font-size: 16px; font-weight: 600; margin: 0; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .detail-dialog-header-meta { display: flex; gap: 6px; flex-shrink: 0; }
    .detail-dialog-close { background: none; border: none; color: rgba(255,255,255,0.5); font-size: 24px; cursor: pointer; padding: 0 4px; line-height: 1; flex-shrink: 0; }
    .detail-dialog-close:hover { color: #f44336; }
    .detail-dialog-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
    .detail-dialog-actions { display: flex; gap: 8px; margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); flex-wrap: wrap; }
  `]
})
export class PodsComponent implements OnInit, OnDestroy {
  readonly store = inject(AdminPodsStore);
  tabColumns = ['match', 'status', 'pick', 'exposure', 'stakeRange', 'refund', 'actions'];
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.store.loadPods();
    this.store.loadReserve();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getExposurePercent(p: AdminPod): number {
    return p.maxTotalExposure > 0 ? Math.round(((p.currentExposure || 0) / p.maxTotalExposure) * 100) : 0;
  }

  isStakingClosed(p: AdminPod): boolean {
    return p.stakingClosesAt ? new Date(p.stakingClosesAt) < new Date() : false;
  }

  statusColor(s: string): string {
    const map: Record<string, string> = { draft: '#555', published: '#E8B923', active: '#00E676', settled: '#2196f3', cancelled: '#f44336', void: '#666' };
    return map[s] || '#555';
  }

  canManage(p: AdminPod): boolean {
    return ['draft', 'published', 'active'].includes(p.status);
  }

  confidenceColor(c: number): string {
    if (c >= 70) return '#00E676';
    if (c >= 45) return '#E8B923';
    return '#f44336';
  }

  settlementColor(p: AdminPod): string {
    const s = p.settlementStatus;
    if (s === 'disputed') return '#E8B923';
    if (s === 'settled') return '#00E676';
    if (s === 'reviewed') return '#81D4FA';
    if (s === 'pending' && p.settlementDisputed) return '#E8B923';
    return '#555';
  }

  isMatchPassed(p: AdminPod): boolean {
    return new Date(p.matchDate) < new Date();
  }
}
