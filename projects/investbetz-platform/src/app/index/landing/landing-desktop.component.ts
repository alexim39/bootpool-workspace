import { Component, ElementRef, inject, AfterViewInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing-desktop',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './landing-desktop.component.html',
  styleUrls: ['./landing-desktop.component.scss']
})
export class LandingDesktopComponent implements AfterViewInit {
  currentYear = new Date().getFullYear();

  constructor(private elementRef: ElementRef) {}

  ngAfterViewInit() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
      );

      this.elementRef.nativeElement.querySelectorAll('.animate-on-scroll').forEach((el: Element) => {
        observer.observe(el);
      });
    }
  }

  faqItems = [
    {
      question: 'How does BetPool make money with a stake-back guarantee?',
      answer: 'BetPool only earns when you win — we take a 30% fee on successful payouts. We manage risk by carefully limiting each offer\'s total stake and maintaining dedicated reserves, so refunds are always fully backed.'
    },
    {
      question: 'Is my stake really guaranteed to be refunded if I lose?',
      answer: 'Absolutely. If the prediction doesn\'t go your way, your full stake is returned to your wallet — no deductions, no delays, no fine print.'
    },
    {
      question: 'Is BetPool considered gambling?',
      answer: 'BetPool is a betting-support platform that lets you back predictions on real sporting outcomes. Unlike traditional betting, your stake is never at risk. We encourage all users to participate responsibly and within their means.'
    },
    {
      question: 'Why can\'t I choose my own odds or markets?',
      answer: 'We deliberately keep a short, curated list of predictions. This protects you from impulsive decisions and endless scrolling — you get quality picks backed by data, not noise.'
    },
    {
      question: 'How fast can I withdraw my money?',
      answer: 'Withdrawals are typically processed within 1-2 business days after identity verification (KYC). Refunds on losing picks are returned to your wallet balance immediately, ready for your next stake or withdrawal request.'
    }
  ];
}
