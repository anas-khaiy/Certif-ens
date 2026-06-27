import React, { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Search,
    BookOpen,
    Clock,
    X,
    Loader2,
    Briefcase,
    Eye,
    Lock,
    Save,
    Layout,
    Layers,
    CheckCircle,
    Upload,
    Info,
    AlertTriangle,
    Globe,
    Users,
    Trash2,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { API_FORMATEUR, API_APPRENANT, API_ADMIN, WS_APPRENANT, WS_LIVEKIT, AI_DETECT_URL, VERIFY_URL_APPRENANT, VERIFY_URL_FORMATEUR } from '../config';

// Dedicated axios instance for the Formateur backend (port 8081).
// Does NOT share the admin api-client interceptor, so a 401 from 8081
// will never trigger the admin logout flow.
const formateurApi = axios.create({
    baseURL: API_FORMATEUR,
    withCredentials: true,
});
formateurApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// --- INJECTED PAGE STYLES ---
const PAGE_STYLES = `
.abm-page {
    background-color: var(--background);
    min-height: 100vh;
    color: var(--text);
    font-family: 'Outfit', 'Inter', system-ui, sans-serif;
}

.abm-header {
    background-color: var(--background);
    padding: 2.5rem 2.5rem 0;
    text-align: center;
}

.abm-header h1 {
    font-size: 2.5rem;
    font-weight: 900;
    color: var(--primary);
    letter-spacing: -0.05em;
    margin-bottom: 0.5rem;
}

.abm-header p {
    font-size: 0.875rem;
    color: var(--text-muted);
    font-weight: 500;
}

.abm-toolbar {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem 2.5rem;
    flex-wrap: wrap;
}

.abm-filter-select {
    padding: 0.55rem 2.25rem 0.55rem 0.9rem;
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text);
    font-size: 0.82rem;
    font-weight: 700;
    font-family: inherit;
    outline: none;
    cursor: pointer;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    flex-shrink: 0;
    height: auto;
    transition: border-color 0.2s;
}

.abm-filter-select:focus {
    border-color: var(--primary);
}

.abm-search-wrap {
    position: relative;
    flex: 1;
    min-width: 220px;
}

.abm-search-wrap svg {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
    pointer-events: none;
}

.abm-search-input {
    width: 100%;
    padding: 0.65rem 1rem 0.65rem 2.75rem;
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text);
    font-size: 0.875rem;
    font-weight: 500;
    outline: none;
    transition: border-color 0.2s;
    height: auto;
    font-family: inherit;
}

.abm-search-input::placeholder {
    color: var(--text-muted);
}

.abm-search-input:focus {
    border-color: var(--primary);
}

.abm-add-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.5rem;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    flex-shrink: 0;
    height: auto;
    transition: background 0.2s, transform 0.1s;
    box-shadow: 0 4px 15px -2px rgba(99,102,241,0.4);
}

.abm-add-btn:hover {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -2px rgba(99,102,241,0.5);
}

/* Cards Grid */
.abm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
    padding: 0 2.5rem 3rem;
}

.abm-card {
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 1.25rem;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.2s, box-shadow 0.2s;
    display: flex;
    flex-direction: column;
}

.abm-card:hover {
    border-color: rgba(99,102,241,0.4);
    box-shadow: 0 8px 30px -5px rgba(0,0,0,0.4);
}

.abm-card-image {
    height: 180px;
    background-color: var(--surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

.abm-card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
}

.abm-card:hover .abm-card-image img {
    transform: scale(1.04);
}

.abm-card-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background-color: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.35);
    color: var(--primary);
    padding: 0.2rem 0.75rem;
    border-radius: 999px;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.08em;
}

.abm-card-body {
    padding: 1.25rem 1.5rem 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.abm-card-title {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 0.5rem;
    line-height: 1.3;
    transition: color 0.2s;
}

.abm-card:hover .abm-card-title {
    color: var(--primary);
}

.abm-card-meta-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    background-color: var(--surface-hover);
    border: 1px solid var(--glass-border);
    border-radius: 0.5rem;
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-bottom: 1rem;
}

.abm-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 0.85rem;
    border-top: 1px solid var(--glass-border);
    margin-top: auto;
}

.abm-card-avatar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
}

.abm-card-avatar-circle {
    width: 2rem;
    height: 2rem;
    border-radius: 0.6rem;
    background-color: var(--surface-hover);
    border: 1px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.6rem;
    font-weight: 900;
    color: var(--text-muted);
}

.abm-card-spec-name {
    font-size: 0.7rem;
    font-weight: 700;
    color: var(--text-muted);
}

.abm-card-date {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.65rem;
    font-weight: 700;
    color: var(--text-muted);
    opacity: 0.5;
}

/* ===== MODAL (Course Editor Style) ===== */
.abm-modal-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    background: rgba(0,0,0,0.85);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow-y: auto;
}

.abm-modal {
    background-color: var(--background);
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
}

/* Modal top bar */
.abm-modal-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    background-color: var(--background);
    border-bottom: 1px solid var(--glass-border);
    flex-shrink: 0;
}

.abm-modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    padding: 0.25rem 0;
    height: auto;
    display: flex;
    align-items: center;
}

.abm-modal-close:hover {
    color: var(--text);
    background: none;
    transform: none;
    box-shadow: none;
}

.abm-modal-title-block h2 {
    font-size: 1.35rem;
    font-weight: 900;
    color: var(--primary);
    margin-bottom: 0.1rem;
}

.abm-modal-title-block p {
    font-size: 0.72rem;
    color: var(--text-muted);
    font-weight: 500;
}

.abm-modal-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.abm-modal-action-icon {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 0.6rem;
    border: 1px solid var(--glass-border);
    background-color: var(--surface);
    color: var(--text-muted);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0;
}

.abm-modal-action-icon:hover {
    background-color: var(--surface-hover);
    color: var(--text);
    transform: none;
    box-shadow: none;
}

.abm-modal-action-save {
    background-color: var(--primary) !important;
    color: white !important;
    border-color: var(--primary) !important;
}

.abm-modal-action-save:hover {
    background-color: var(--primary-hover) !important;
    transform: none;
}

/* Tab bar */
.abm-tab-bar {
    display: flex;
    align-items: center;
    background-color: var(--surface);
    border-bottom: 1px solid var(--glass-border);
    padding: 0 1.5rem;
    gap: 0;
    flex-shrink: 0;
}

.abm-tab {
    padding: 0.85rem 1.5rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    cursor: pointer;
    border: none;
    background: none;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: all 0.2s;
    height: auto;
    white-space: nowrap;
    border-radius: 0;
}

.abm-tab:hover {
    color: var(--text);
    background: none;
    transform: none;
    box-shadow: none;
}

.abm-tab.active {
    color: white;
    background-color: var(--primary);
    border-radius: 0.5rem;
    border-bottom-color: transparent;
    margin-bottom: 0.35rem;
    margin-top: 0.35rem;
}

/* Form area */
.abm-modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 2.5rem 1.5rem;
}

.abm-form-card {
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 1.25rem;
    padding: 2rem;
    max-width: 860px;
    margin: 0 auto;
}

.abm-form-card-title {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-size: 1.15rem;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 2rem;
}

.abm-form-card-title svg {
    color: var(--primary);
    flex-shrink: 0;
}

.abm-form-grid {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 2rem;
    align-items: start;
}

/* Cover upload */
.abm-cover-upload {
    border: 2px dashed var(--glass-border);
    border-radius: 1rem;
    aspect-ratio: 1 / 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s;
    color: var(--text-muted);
}

.abm-cover-upload:hover {
    border-color: rgba(99,102,241,0.5);
    background: rgba(99,102,241,0.04);
}

.abm-cover-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    margin-top: 0.25rem;
}

/* Form fields */
.abm-fields {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.abm-field-label {
    display: block;
    font-size: 0.65rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 0.4rem;
}

.abm-field-input, .abm-field-select, .abm-field-textarea {
    width: 100%;
    padding: 0.75rem 1rem;
    background-color: var(--background);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text);
    font-size: 0.875rem;
    font-weight: 500;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s;
    height: auto;
}

.abm-field-input:focus, .abm-field-select:focus, .abm-field-textarea:focus {
    border-color: var(--primary);
}

.abm-field-input::placeholder, .abm-field-textarea::placeholder {
    color: var(--text-muted);
    opacity: 0.5;
}

.abm-field-select {
    appearance: none;
    cursor: pointer;
}

.abm-field-textarea {
    resize: none;
    min-height: 90px;
}

.abm-fields-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

/* Module library */
.abm-modules-section {
    padding: 0 1.5rem 3rem;
    max-width: 860px;
    margin: 0 auto;
}

.abm-section-heading {
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-muted);
    margin-bottom: 1rem;
}

.abm-module-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 0.75rem;
    max-height: 340px;
    overflow-y: auto;
    padding-right: 0.25rem;
}

.abm-module-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;
}

.abm-module-item:hover {
    border-color: rgba(99,102,241,0.4);
}

.abm-module-item.selected {
    background-color: rgba(99,102,241,0.08);
    border-color: rgba(99,102,241,0.5);
}

.abm-module-check {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 0.35rem;
    border: 2px solid var(--glass-border);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
}

.abm-module-item.selected .abm-module-check {
    background-color: var(--primary);
    border-color: var(--primary);
}

.abm-module-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background-color: var(--surface-hover);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    flex-shrink: 0;
    transition: all 0.2s;
}

.abm-module-item.selected .abm-module-icon {
    background-color: rgba(99,102,241,0.15);
    color: var(--primary);
}

.abm-module-name {
    font-size: 0.78rem;
    font-weight: 700;
    color: var(--text);
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

/* Footer save bar */
.abm-modal-footer {
    border-top: 1px solid var(--glass-border);
    background-color: var(--background);
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: flex-end;
    gap: 0.75rem;
    flex-shrink: 0;
}

.abm-cancel-btn {
    padding: 0.7rem 1.75rem;
    border: 1px solid var(--glass-border);
    background: var(--surface);
    color: var(--text-muted);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    height: auto;
}

.abm-cancel-btn:hover {
    background: var(--surface-hover);
    color: var(--text);
    transform: none;
    box-shadow: none;
}

.abm-save-btn {
    padding: 0.7rem 2rem;
    background-color: var(--primary);
    color: white;
    border: none;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    height: auto;
    transition: all 0.2s;
    box-shadow: 0 4px 15px -2px rgba(99,102,241,0.4);
}

.abm-save-btn:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 8px 20px -2px rgba(99,102,241,0.5);
}

.abm-save-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

/* Empty state */
.abm-empty {
    padding: 5rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-muted);
    opacity: 0.35;
}

.abm-empty svg { color: var(--text-muted); }

/* Scrollbar */
.abm-module-grid::-webkit-scrollbar { width: 4px; }
.abm-module-grid::-webkit-scrollbar-track { background: transparent; }
.abm-module-grid::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 9px; }

/* Delete button on card */
.abm-card-delete {
    position: absolute;
    top: 0.85rem;
    right: 0.85rem;
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.2s, background 0.2s;
    padding: 0;
    z-index: 10;
}

.abm-card:hover .abm-card-delete {
    opacity: 1;
}

.abm-card-delete:hover {
    background: rgba(239, 68, 68, 0.85);
    color: white;
    transform: none;
    box-shadow: none;
}

/* Confirm modal */
.abm-confirm-overlay {
    position: fixed;
    inset: 0;
    z-index: 2000;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
}

.abm-confirm-box {
    background: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 1.25rem;
    padding: 2rem;
    max-width: 400px;
    width: 100%;
    text-align: center;
}

.abm-confirm-icon {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.25rem;
    color: #ef4444;
}

.abm-confirm-title {
    font-size: 1.1rem;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 0.5rem;
}

.abm-confirm-msg {
    font-size: 0.82rem;
    color: var(--text-muted);
    margin-bottom: 1.75rem;
    line-height: 1.5;
}

.abm-confirm-actions {
    display: flex;
    gap: 0.75rem;
}

.abm-confirm-cancel {
    flex: 1;
    padding: 0.7rem;
    border: 1px solid var(--glass-border);
    background: var(--surface-hover);
    color: var(--text-muted);
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    height: auto;
}

.abm-confirm-cancel:hover {
    color: var(--text);
    transform: none;
    box-shadow: none;
}

.abm-confirm-delete {
    flex: 1;
    padding: 0.7rem;
    border: none;
    background: #ef4444;
    color: white;
    border-radius: 0.75rem;
    font-size: 0.875rem;
    font-weight: 800;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    height: auto;
    transition: all 0.2s;
}

.abm-confirm-delete:hover {
    background: #dc2626;
    transform: none;
    box-shadow: none;
}

/* Pagination Styles */
.abm-pagination {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.5rem 2rem;
    background-color: var(--surface);
    border: 1px solid var(--glass-border);
    border-radius: 1.25rem;
    margin-top: 1rem;
    transition: all 0.3s ease;
}

.abm-pagination-info {
    font-size: 0.82rem;
    color: var(--text-muted);
    font-weight: 600;
}

.abm-pagination-info span {
    color: var(--text);
    font-weight: 800;
}

.abm-pagination-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.abm-pagination-btn {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    padding: 0;
}

.abm-pagination-btn:hover:not(:disabled) {
    border-color: var(--primary);
    color: var(--primary);
    background-color: rgba(99,102,241,0.05);
}

.abm-pagination-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
}

.abm-pagination-numbers {
    display: flex;
    gap: 0.4rem;
}

.abm-pagination-number {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--background);
    border: 1px solid var(--glass-border);
    border-radius: 0.75rem;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}

.abm-pagination-number:hover {
    border-color: var(--primary);
    color: var(--primary);
}

.abm-pagination-number.active {
    background-color: var(--primary);
    border-color: var(--primary);
    color: white;
    box-shadow: 0 4px 12px rgba(99,102,241,0.3);
}

.abm-pagination-ellipsis {
    width: 2.5rem;
    height: 2.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    font-weight: 700;
}

.abm-pagination-size {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--text-muted);
}

.abm-pagination-size-select {
    background: var(--background);
    border: 1px solid var(--glass-border);
    border-radius: 0.5rem;
    padding: 0.2rem 0.5rem;
    color: var(--text);
    font-weight: 800;
    cursor: pointer;
    outline: none;
}
`;

// Types
interface Course { 
    id: number; 
    title: string; 
    description?: string; 
    specialiteId?: number; 
    published: boolean;
    enseignant?: { 
        nom: string; 
        prenom: string; 
    };
}
interface Specialty { id: number; nom: string; }

type TabId = 'info' | 'modules' | 'learners';


const AdminBundleManagementPage: React.FC = () => {
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [specialties, setSpecialties] = useState<Specialty[]>([]);
    const [bundles, setBundles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<TabId>('info');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSpecId, setFilterSpecId] = useState<number | 'all'>('all');
    const [modalCourseSearch, setModalCourseSearch] = useState('');
    const [modalSpecFilter, setModalSpecFilter] = useState<number | 'all'>('all');
    const [saving, setSaving] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [editTargetId, setEditTargetId] = useState<number | null>(null);
    const [bundleEnrollments, setBundleEnrollments] = useState<any[]>([]);
    const [loadingEnrollments, setLoadingEnrollments] = useState(false);
    const [expandedLearnerId, setExpandedLearnerId] = useState<number | null>(null);
    const [detailedProgress, setDetailedProgress] = useState<Record<number, any>>({});
    const [loadingDetailed, setLoadingDetailed] = useState<Record<number, boolean>>({});

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    const [form, setForm] = useState({
        title: '',
        description: '',
        coverImage: '',
        specialtyId: '' as number | '',
        courses: [] as Course[],
        published: true
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [coursesRes, bundlesRes, specsRes] = await Promise.all([
                formateurApi.get('/courses/all'),
                formateurApi.get('/bundles'),
                formateurApi.get('/specialites')
            ]);
            setAllCourses(coursesRes.data || []);
            setBundles(bundlesRes.data || []);
            setSpecialties(specsRes.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = () => {
        setEditTargetId(null);
        setForm({ title: '', description: '', coverImage: '', specialtyId: '', courses: [], published: true });
        setActiveTab('info');
        setModalCourseSearch('');
        setModalSpecFilter('all');
        setShowModal(true);
    };

    const openEditModal = (bundle: any) => {
        setEditTargetId(bundle.id);
        setForm({
            title: bundle.title || '',
            description: bundle.description || '',
            coverImage: bundle.coverImage || '',
            specialtyId: bundle.specialite?.id || '',
            courses: bundle.courses || [],
            published: bundle.published !== false
        });
        setActiveTab('info');
        setModalCourseSearch('');
        setModalSpecFilter('all');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditTargetId(null);
    };

    const toggleCourse = (course: Course) => {
        setForm(prev => {
            const exists = prev.courses.find(c => c.id === course.id);
            return { ...prev, courses: exists ? prev.courses.filter(c => c.id !== course.id) : [...prev.courses, course] };
        });
    };

    const handleSave = async () => {
        if (!form.title.trim() || form.courses.length === 0) return alert('Titre et modules requis.');
        setSaving(true);
        try {
            // Send only IDs so JPA can resolve entities by PK
            const payload = {
                title: form.title,
                description: form.description,
                coverImage: form.coverImage,
                published: form.published,
                courses: form.courses.map(c => ({ id: c.id }))
            };
            const baseUrl = `/bundles/admin${editTargetId ? `/${editTargetId}` : ''}`;
            const url = `${baseUrl}${
                form.specialtyId ? `?specialtyId=${form.specialtyId}` : ''
            }`;
            
            if (editTargetId) {
                await formateurApi.put(url, payload);
            } else {
                await formateurApi.post(url, payload);
            }
            
            closeModal();
            fetchData();
        } catch (err: any) {
            console.error(err);
            alert('Erreur lors de la sauvegarde: ' + (err?.response?.data?.message || err.message));
        } finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await formateurApi.delete(`/bundles/admin/${deleteTarget.id}`);
            setDeleteTarget(null);
            fetchData();
        } catch (err: any) {
            alert('Erreur lors de la suppression: ' + (err?.response?.data?.message || err.message));
        } finally { setDeleting(false); }
    };

    const fetchBundleEnrollments = async (bundleId: number) => {
        setLoadingEnrollments(true);
        try {
            const response = await formateurApi.get(`/bundles/admin/${bundleId}/enrollments`);
            const enrollments = response.data || [];
            
            // Fetch progress for accepted enrollments
            const withProgress = await Promise.all(enrollments.map(async (enc: any) => {
                if (enc.status === 'ACCEPTED') {
                    try {
                        const progRes = await formateurApi.get(`/bundles/admin/enrollments/${enc.id}/progress`);
                        return { ...enc, progress: progRes.data.progress };
                    } catch { return { ...enc, progress: 0 }; }
                }
                return { ...enc, progress: 0 };
            }));
            
            setBundleEnrollments(withProgress);
        } catch (err) {
            console.error("Failed to fetch enrollments", err);
        } finally {
            setLoadingEnrollments(false);
        }
    };



    const fetchDetailedProgress = async (enrollmentId: number) => {
        if (detailedProgress[enrollmentId]) return;
        setLoadingDetailed(prev => ({ ...prev, [enrollmentId]: true }));
        try {
            const res = await formateurApi.get(`/bundles/admin/enrollments/${enrollmentId}/detailed-progress`);
            setDetailedProgress(prev => ({ ...prev, [enrollmentId]: res.data }));
        } catch (err) {
            console.error("Failed to fetch detailed progress", err);
        } finally {
            setLoadingDetailed(prev => ({ ...prev, [enrollmentId]: false }));
        }
    };

    useEffect(() => {
        if (editTargetId && activeTab === 'learners') {
            fetchBundleEnrollments(editTargetId);
            setExpandedLearnerId(null);
        }
    }, [editTargetId, activeTab]);

    const filteredBundles = useMemo(() => {
        return bundles
            .sort((a, b) => b.id - a.id)
            .filter(b => {
                const matchSearch = b.title?.toLowerCase().includes(searchTerm.toLowerCase());
                const matchSpec = filterSpecId === 'all' || (b.specialite && b.specialite.id === filterSpecId);
                return matchSearch && matchSpec;
            });
    }, [bundles, searchTerm, filterSpecId]);

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSpecId]);

    const totalPages = Math.ceil(filteredBundles.length / itemsPerPage);
    const paginatedBundles = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredBundles.slice(start, start + itemsPerPage);
    }, [filteredBundles, currentPage, itemsPerPage]);

    const getPages = () => {
        const pages: (number | string)[] = [];
        const showMax = 5;
        if (totalPages <= showMax) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    const filteredModalCourses = useMemo(() => {
        return allCourses.filter(c => {
            const matchSearch = c.title.toLowerCase().includes(modalCourseSearch.toLowerCase());
            const matchSpec = modalSpecFilter === 'all' || c.specialiteId === modalSpecFilter;
            // Only show courses that are published (public)
            return matchSearch && matchSpec && c.published === true;
        });
    }, [allCourses, modalCourseSearch, modalSpecFilter]);

    const specInitials = (name?: string) => {
        if (!name) return 'GN';
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <>
            <style>{PAGE_STYLES}</style>
            <div className="abm-page">
                {/* Header */}
                <div className="abm-header">
                    <h1>Mes Parcours</h1>
                    <p>Gérez vos programmes d'apprentissage et certifications</p>
                </div>

                {/* Toolbar */}
                <div className="abm-toolbar">
                    <select
                        className="abm-filter-select"
                        value={filterSpecId}
                        onChange={e => setFilterSpecId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    >
                        <option value="all">Toutes les filières</option>
                        {specialties.map(s => (
                            <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                    </select>

                    <div className="abm-search-wrap">
                        <Search size={16} />
                        <input
                            className="abm-search-input"
                            type="text"
                            placeholder="Rechercher un parcours..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="abm-add-btn" onClick={openModal}>
                        <Plus size={18} strokeWidth={3} />
                        Nouveau Parcours
                    </button>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="abm-empty">
                        <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                        <p style={{ fontSize: '0.8rem', fontWeight: 700 }}>Chargement...</p>
                    </div>
                ) : filteredBundles.length === 0 ? (
                    <div className="abm-empty">
                        <Briefcase size={50} />
                        <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>Aucun parcours</h3>
                        <p style={{ fontSize: '0.8rem' }}>Créez votre premier programme d'apprentissage</p>
                    </div>
                ) : (
                    <div className="abm-grid">
                        <AnimatePresence mode="popLayout">
                            {paginatedBundles.map(bundle => (
                                <motion.div
                                    key={bundle.id}
                                    layout
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="abm-card"
                                    style={{ position: 'relative' }}
                                    onClick={() => openEditModal(bundle)}
                                >
                                    {/* Delete button */}
                                    <button
                                        className="abm-card-delete"
                                        title="Supprimer ce parcours"
                                        onClick={e => {
                                            e.stopPropagation();
                                            setDeleteTarget({ id: bundle.id, title: bundle.title });
                                        }}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="abm-card-image">
                                        {bundle.coverImage
                                            ? <img src={bundle.coverImage} alt={bundle.title} />
                                            : <BookOpen size={40} style={{ color: 'rgba(99,102,241,0.2)' }} />
                                        }
                                        <span className="abm-card-badge">
                                            {bundle.specialite?.nom || 'Général'}
                                        </span>
                                    </div>
                                    <div className="abm-card-body">
                                        <div className="abm-card-title">{bundle.title}</div>
                                        <div className="abm-card-meta-tag">
                                            <Layers size={12} style={{ color: 'var(--primary)' }} />
                                            {bundle.courses?.length || 0} Modules
                                        </div>
                                        <div className="abm-card-footer">
                                            <div className="abm-card-avatar">
                                                <div className="abm-card-avatar-circle">
                                                    {specInitials(bundle.specialite?.nom)}
                                                </div>
                                                <span className="abm-card-spec-name">
                                                    {bundle.specialite?.nom || 'Général'}
                                                </span>
                                            </div>
                                            <div 
                                                className="abm-card-date"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `/admin-bundle-enrollments?bundleId=${bundle.id}`;
                                                }}
                                            >
                                                <Clock size={11} />
                                                Voir inscriptions
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Pagination Bar */}
                        {totalPages > 1 && (
                            <div className="abm-pagination">
                                <div className="abm-pagination-info">
                                    Affichage <span>{(currentPage - 1) * itemsPerPage + 1}</span> - <span>{Math.min(currentPage * itemsPerPage, filteredBundles.length)}</span> sur <span>{filteredBundles.length}</span> parcours
                                </div>

                                <div className="abm-pagination-controls">
                                    <div className="abm-pagination-size" style={{ marginRight: '1rem' }}>
                                        <span>Afficher</span>
                                        <select 
                                            className="abm-pagination-size-select"
                                            value={itemsPerPage}
                                            onChange={(e) => {
                                                setItemsPerPage(Number(e.target.value));
                                                setCurrentPage(1);
                                            }}
                                        >
                                            <option value={4}>4</option>
                                            <option value={8}>8</option>
                                            <option value={12}>12</option>
                                            <option value={16}>16</option>
                                        </select>
                                    </div>

                                    <button 
                                        className="abm-pagination-btn"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft size={18} />
                                    </button>

                                    <div className="abm-pagination-numbers">
                                        {getPages().map((p, i) => (
                                            p === '...' ? (
                                                <div key={i} className="abm-pagination-ellipsis">...</div>
                                            ) : (
                                                <button
                                                    key={i}
                                                    className={`abm-pagination-number ${currentPage === p ? 'active' : ''}`}
                                                    onClick={() => typeof p === 'number' && setCurrentPage(p)}
                                                >
                                                    {p}
                                                </button>
                                            )
                                        ))}
                                    </div>

                                    <button 
                                        className="abm-pagination-btn"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Creation Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="abm-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="abm-modal"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                        >
                            {/* Top Bar */}
                            <div className="abm-modal-topbar">
                                <button className="abm-modal-close" onClick={closeModal}>
                                    <X size={22} strokeWidth={2.5} />
                                </button>
                                <div className="abm-modal-title-block">
                                    <h2>{editTargetId ? 'Édition du parcours' : 'Nouveau parcours'}</h2>
                                    <p>{form.courses.length} module{form.courses.length !== 1 ? 's' : ''} sélectionné{form.courses.length !== 1 ? 's' : ''}</p>
                                </div>
                                <div className="abm-modal-actions">
                                    <button 
                                        className={`abm-modal-action-icon ${!form.published ? 'active-warning' : 'active-success'}`} 
                                        title={form.published ? "Public (Globe)" : "Brouillon (Cadenas)"}
                                        onClick={() => setForm({ ...form, published: !form.published })}
                                        style={{ 
                                            color: form.published ? '#10b981' : '#f59e0b',
                                            backgroundColor: form.published ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'
                                        }}
                                    >
                                        {form.published ? <Globe size={18} /> : <Lock size={18} />}
                                    </button>
                                    <button 
                                        className="abm-modal-action-icon abm-modal-action-save" 
                                        title="Enregistrer" 
                                        onClick={() => handleSave()}
                                        disabled={saving || !form.title.trim() || form.courses.length === 0}
                                        style={{ opacity: saving || !form.title.trim() || form.courses.length === 0 ? 0.5 : 1 }}
                                    >
                                        <Save size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Bar */}
                            <div className="abm-tab-bar">
                                <button
                                    className={`abm-tab ${activeTab === 'info' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('info')}
                                >Informations</button>
                                <button
                                    className={`abm-tab ${activeTab === 'modules' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('modules')}
                                >Contenu (Modules)</button>
                                
                                {editTargetId && (
                                    <button
                                        className={`abm-tab ${activeTab === 'learners' ? 'active' : ''}`}
                                        onClick={() => setActiveTab('learners')}
                                    >Apprenants & Progrès</button>
                                )}
                            </div>

                            {/* Body */}
                            <div className="abm-modal-body">
                                {activeTab === 'info' && (
                                    <div className="abm-form-card">
                                        <div className="abm-form-card-title">
                                            <Layout size={22} />
                                            Présentation du parcours
                                        </div>
                                        <div className="abm-form-grid">
                                            {/* Cover */}
                                            <div>
                                                <label 
                                                    className="abm-cover-upload" 
                                                    title="Changer la couverture"
                                                    style={{ 
                                                        cursor: 'pointer',
                                                        position: 'relative',
                                                        ...(form.coverImage ? { 
                                                            backgroundImage: `url(${form.coverImage})`, 
                                                            backgroundSize: 'cover', 
                                                            backgroundPosition: 'center',
                                                            color: 'transparent'
                                                        } : {})
                                                    }}
                                                >
                                                    {!form.coverImage && (
                                                        <>
                                                            <Upload size={28} />
                                                            <span className="abm-cover-label">Couverture</span>
                                                        </>
                                                    )}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        hidden 
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    setForm({ ...form, coverImage: reader.result as string });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }} 
                                                    />
                                                </label>
                                            </div>

                                            {/* Fields */}
                                            <div className="abm-fields">
                                                <div>
                                                    <label className="abm-field-label">Titre du Parcours</label>
                                                    <input
                                                        className="abm-field-input"
                                                        placeholder="Ex: Architecture logicielle avancée"
                                                        value={form.title}
                                                        onChange={e => setForm({ ...form, title: e.target.value })}
                                                    />
                                                </div>
                                                <div className="abm-fields-row">
                                                    <div>
                                                        <label className="abm-field-label">Spécialité</label>
                                                        <select
                                                            className="abm-field-select"
                                                            value={form.specialtyId}
                                                            onChange={e => setForm({ ...form, specialtyId: e.target.value ? Number(e.target.value) : '' })}
                                                        >
                                                            <option value="">-- Toutes spécialités --</option>
                                                            {specialties.map(s => (
                                                                <option key={s.id} value={s.id}>{s.nom}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="abm-field-label">Niveau</label>
                                                        <select className="abm-field-select">
                                                            <option>Licence</option>
                                                            <option>Master</option>
                                                            <option>Libre</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="abm-field-label">
                                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                            <Info size={12} style={{ color: 'var(--primary)' }} />
                                                            Description (optionnel)
                                                        </span>
                                                    </label>
                                                    <textarea
                                                        className="abm-field-textarea"
                                                        placeholder="Décrivez l'objectif de ce programme..."
                                                        value={form.description}
                                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'modules' && (
                                    <div className="abm-form-card">
                                        <div className="abm-form-card-title">
                                            <Layers size={22} />
                                            Sélection des modules ({form.courses.length} sélectionné{form.courses.length !== 1 ? 's' : ''})
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <select
                                                className="abm-filter-select"
                                                value={modalSpecFilter}
                                                onChange={e => setModalSpecFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                                style={{ fontSize: '0.8rem' }}
                                            >
                                                <option value="all">Toutes les filières</option>
                                                {specialties.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nom}</option>
                                                ))}
                                            </select>
                                            <div className="abm-search-wrap" style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                                                <Search size={15} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                <input
                                                    className="abm-search-input"
                                                    style={{ backgroundColor: 'var(--background)' }}
                                                    type="text"
                                                    placeholder="Filtrer les modules..."
                                                    value={modalCourseSearch}
                                                    onChange={e => setModalCourseSearch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="abm-module-grid">
                                            {filteredModalCourses.map(course => {
                                                const selected = !!form.courses.find(c => c.id === course.id);
                                                return (
                                                    <div
                                                        key={course.id}
                                                        className={`abm-module-item ${selected ? 'selected' : ''}`}
                                                        onClick={() => toggleCourse(course)}
                                                    >
                                                        <div className="abm-module-icon">
                                                            <BookOpen size={15} />
                                                        </div>
                                                        <div className="abm-module-info-wrap" style={{ flex: 1, minWidth: 0 }}>
                                                            <div className="abm-module-name" style={{ marginBottom: '2px', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)' }}>{course.title}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, opacity: 0.8 }}>
                                                                Formateur: {course.enseignant ? `${course.enseignant.prenom} ${course.enseignant.nom}` : 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div className="abm-module-check">
                                                            {selected && <CheckCircle size={14} style={{ color: 'white' }} />}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'learners' && (
                                    <div className="abm-form-card" style={{ maxWidth: '1000px' }}>
                                        <div className="abm-form-card-title">
                                            <Users size={22} />
                                            Apprenants inscrits et Progression
                                        </div>
                                        
                                        {loadingEnrollments ? (
                                            <div className="flex flex-col items-center justify-center py-20 gap-3">
                                                <Loader2 className="animate-spin text-primary" size={40} />
                                                <p className="text-xs font-bold text-text-muted">Chargement des données...</p>
                                            </div>
                                        ) : bundleEnrollments.length === 0 ? (
                                            <div className="abm-empty">
                                                <Users size={50} style={{ opacity: 0.2 }} />
                                                <h3 style={{ fontWeight: 800, fontSize: '1rem' }}>Aucune inscription</h3>
                                                <p style={{ fontSize: '0.8rem' }}>Personne n'est encore inscrit à ce parcours.</p>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                                {bundleEnrollments.map((enc) => {
                                                    const user = enc.apprenant || enc.enseignant;
                                                    const isExpanded = expandedLearnerId === enc.id;
                                                    const details = detailedProgress[enc.id];
                                                    const isLoading = loadingDetailed[enc.id];

                                                    return (
                                                        <div key={enc.id} 
                                                            onClick={() => {
                                                                if (enc.status === 'ACCEPTED') {
                                                                    setExpandedLearnerId(isExpanded ? null : enc.id);
                                                                    if (!isExpanded) fetchDetailedProgress(enc.id);
                                                                }
                                                            }}
                                                            style={{ 
                                                                display: 'flex', 
                                                                flexDirection: 'column',
                                                                gap: '0.5rem', 
                                                                padding: '1.25rem', 
                                                                backgroundColor: 'var(--background)', 
                                                                border: '1px solid var(--glass-border)', 
                                                                borderRadius: '1.25rem',
                                                                cursor: enc.status === 'ACCEPTED' ? 'pointer' : 'default',
                                                                transition: 'all 0.2s'
                                                            }}
                                                            className={isExpanded ? 'abm-learner-expanded' : ''}
                                                        >
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                                                {/* Avatar */}
                                                                <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', overflow: 'hidden', border: '1px solid var(--glass-border)', flexShrink: 0 }}>
                                                                    <img 
                                                                        src={`${API_FORMATEUR}/files/profiles/${user?.photoProfile || 'default.png'}`} 
                                                                        alt={user?.nom}
                                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                        onError={(e) => (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${user?.prenom}+${user?.nom}&background=6366f1&color=fff`}
                                                                    />
                                                                </div>

                                                                {/* Info */}
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                                                                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user?.prenom} {user?.nom}</div>
                                                                        <span style={{ 
                                                                            fontSize: '0.6rem', 
                                                                            padding: '0.15rem 0.5rem', 
                                                                            borderRadius: '6px', 
                                                                            fontWeight: 900, 
                                                                            textTransform: 'uppercase',
                                                                            backgroundColor: enc.apprenant ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                                                                            color: enc.apprenant ? '#10b981' : 'var(--primary)'
                                                                        }}>
                                                                            {enc.apprenant ? 'Apprenant' : 'Formateur'}
                                                                        </span>
                                                                    </div>
                                                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>{user?.email}</div>

                                                                    {enc.status === 'ACCEPTED' ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                                            <div style={{ flex: 1, height: '7px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                                                                                <div style={{ 
                                                                                    height: '100%', 
                                                                                    width: `${enc.progress || 0}%`, 
                                                                                    backgroundColor: 'var(--primary)',
                                                                                    transition: 'width 1s ease-out',
                                                                                    boxShadow: '0 0 10px rgba(99,102,241,0.3)'
                                                                                }} />
                                                                            </div>
                                                                            <div style={{ fontSize: '0.85rem', fontWeight: 900, color: 'var(--primary)' }}>{Math.round(enc.progress || 0)}%</div>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ 
                                                                            fontSize: '0.75rem', 
                                                                            fontWeight: 800, 
                                                                            color: enc.status === 'PENDING' ? '#f59e0b' : '#ef4444',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '0.4rem'
                                                                        }}>
                                                                            {enc.status === 'PENDING' ? <Clock size={14} /> : <X size={14} />}
                                                                            {enc.status === 'PENDING' ? 'En attente de validation' : 'Inscription refusée'}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {enc.status === 'ACCEPTED' && (
                                                                    <div style={{ color: 'var(--text-muted)', opacity: 0.5 }}>
                                                                        <Eye size={18} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {/* Detailed Progress Section */}
                                                            <AnimatePresence>
                                                                {isExpanded && (
                                                                    <motion.div
                                                                        initial={{ height: 0, opacity: 0 }}
                                                                        animate={{ height: 'auto', opacity: 1 }}
                                                                        exit={{ height: 0, opacity: 0 }}
                                                                        style={{ overflow: 'hidden' }}
                                                                    >
                                                                        <div style={{ 
                                                                            marginTop: '1.25rem', 
                                                                            padding: '1.25rem', 
                                                                            backgroundColor: 'rgba(255,255,255,0.02)', 
                                                                            borderRadius: '1rem',
                                                                            border: '1px solid var(--glass-border)',
                                                                            display: 'grid',
                                                                            gap: '1rem'
                                                                        }}>
                                                                            <div style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--primary)', marginBottom: '0.25rem' }}>
                                                                                Détails de progression par module
                                                                            </div>
                                                                            
                                                                            {isLoading ? (
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem' }}>
                                                                                    <Loader2 size={16} className="animate-spin" />
                                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Chargement des modules...</span>
                                                                                </div>
                                                                            ) : (
                                                                                <div style={{ display: 'grid', gap: '0.85rem' }}>
                                                                                    {form.courses.map(course => {
                                                                                        const prog = details?.courseProgress?.[course.id] || 0;
                                                                                        return (
                                                                                            <div key={course.id} style={{ display: 'grid', gap: '0.4rem' }}>
                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700 }}>
                                                                                                    <span style={{ color: 'var(--text)' }}>{course.title}</span>
                                                                                                    <span style={{ color: prog === 100 ? '#10b981' : 'var(--text-muted)' }}>{Math.round(prog)}%</span>
                                                                                                </div>
                                                                                                <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                                                                                                    <div style={{ 
                                                                                                        height: '100%', 
                                                                                                        width: `${prog}%`, 
                                                                                                        backgroundColor: prog === 100 ? '#10b981' : 'var(--primary)',
                                                                                                        opacity: 0.8
                                                                                                    }} />
                                                                                                </div>
                                                                                            </div>
                                                                                        );
                                                                                    })}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="abm-modal-footer">
                                <button className="abm-cancel-btn" onClick={closeModal}>Annuler</button>
                                <button
                                    className="abm-save-btn"
                                    onClick={() => handleSave()}
                                    disabled={saving || !form.title.trim() || form.courses.length === 0}
                                >
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                    {editTargetId ? 'Mettre à jour le parcours' : 'Créer le parcours'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="abm-confirm-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !deleting && setDeleteTarget(null)}
                    >
                        <motion.div
                            className="abm-confirm-box"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="abm-confirm-icon">
                                <AlertTriangle size={28} />
                            </div>
                            <div className="abm-confirm-title">Supprimer le parcours ?</div>
                            <div className="abm-confirm-msg">
                                <strong style={{ color: 'var(--text)' }}>« {deleteTarget.title} »</strong> sera définitivement supprimé avec toutes ses inscriptions. Cette action est irréversible.
                            </div>
                            <div className="abm-confirm-actions">
                                <button
                                    className="abm-confirm-cancel"
                                    onClick={() => setDeleteTarget(null)}
                                    disabled={deleting}
                                >Annuler</button>
                                <button
                                    className="abm-confirm-delete"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    {deleting
                                        ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Trash2 size={15} />
                                    }
                                    Supprimer
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default AdminBundleManagementPage;
