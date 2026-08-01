import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { OraChatComponent } from './ora-chat.component';
import { AuthService, StakeService, WalletService, WalletBalance, DeviceService, ChatAction } from '../../services';

describe('OraChatComponent', () => {
  let fixture: ComponentFixture<OraChatComponent>;
  let component: OraChatComponent;
  let authMock: jasmine.SpyObj<AuthService>;
  let stakeMock: jasmine.SpyObj<StakeService>;
  let walletMock: jasmine.SpyObj<WalletService>;
  let deviceMock: { isMobile: ReturnType<typeof signal<boolean>>; isTablet: ReturnType<typeof signal<boolean>> };

  const stakeAction: ChatAction = {
    type: 'confirm_stake',
    data: {
      podId: 'pod-1',
      podTitle: 'Arsenal vs Chelsea',
      selection: 'Home Win',
      amount: 1000,
      gainsMultiplier: 2.1,
      potentialPayout: 2100,
      platformFee: 210,
      netPayout: 1890,
    },
  };

  const accAction: ChatAction = {
    type: 'confirm_accumulator',
    data: {
      legs: [
        { podId: 'pod-1', podTitle: 'Arsenal vs Chelsea', selection: 'Home Win', gainsMultiplier: 2.1 },
        { podId: 'pod-2', podTitle: 'IK Start vs Viking FK', selection: 'Away Win', gainsMultiplier: 1.7 },
      ],
      stakeAmount: 500,
      combinedMultiplier: 3.57,
      potentialPayout: 1785,
      platformFee: 178,
      netPayout: 1607,
    },
  };

  function addActionMessage(action: ChatAction) {
    component.messages.update(m => [...m, {
      role: 'assistant',
      content: 'Here is your bet card.',
      time: '10:00',
      actions: [action],
      actionStates: ['pending'],
    }]);
    return component.messages().length - 1;
  }

  beforeEach(async () => {
    authMock = jasmine.createSpyObj('AuthService', ['chatWithOra']);
    stakeMock = jasmine.createSpyObj('StakeService', ['placeStake', 'placeAccumulator']);
    walletMock = jasmine.createSpyObj('WalletService', ['fetchBalance'], {
      balance: signal<WalletBalance>({ balance: 0, locked: 0, available: 0, currency: 'NGN' }),
    });
    deviceMock = { isMobile: signal(false), isTablet: signal(false) };

    await TestBed.configureTestingModule({
      imports: [OraChatComponent],
      providers: [
        { provide: AuthService, useValue: authMock },
        { provide: StakeService, useValue: stakeMock },
        { provide: WalletService, useValue: walletMock },
        { provide: DeviceService, useValue: deviceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OraChatComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('maps chat actions onto the assistant message with pending states and strips tags', () => {
    authMock.chatWithOra.and.returnValue(of({
      success: true,
      data: {
        content: '[STAKE]{"podTitle":"Arsenal vs Chelsea"}[/STAKE] Here is your bet card.',
        actions: [stakeAction],
      },
    }));

    component.inputText = 'bet 1000 on arsenal';
    component.sendMessage();

    const last = component.messages()[component.messages().length - 1];
    expect(last.actions).toEqual([stakeAction]);
    expect(last.actionStates).toEqual(['pending']);
    expect(last.displayContent).not.toContain('[STAKE]');
  });

  it('confirmStake places a single stake with podId and amount', () => {
    stakeMock.placeStake.and.returnValue(of({ success: true }));
    const msgIdx = addActionMessage(stakeAction);

    component.confirmStake(msgIdx, 0);

    expect(stakeMock.placeStake).toHaveBeenCalledWith({ podId: 'pod-1', stakeAmount: 1000 });
    expect(component.messages()[msgIdx].actionStates?.[0]).toBe('done');
    const last = component.messages()[component.messages().length - 1];
    expect(last.content).toContain('Bet placed');
    expect(last.content).toContain('Arsenal vs Chelsea');
    expect(walletMock.fetchBalance).toHaveBeenCalled();
  });

  it('confirmStake places an accumulator with podIds and total stake', () => {
    stakeMock.placeAccumulator.and.returnValue(of({ success: true }));
    const msgIdx = addActionMessage(accAction);

    component.confirmStake(msgIdx, 0);

    expect(stakeMock.placeAccumulator).toHaveBeenCalledWith({ podIds: ['pod-1', 'pod-2'], stakeAmount: 500 });
    expect(component.messages()[msgIdx].actionStates?.[0]).toBe('done');
    const last = component.messages()[component.messages().length - 1];
    expect(last.content).toContain('2-leg accumulator');
  });

  it('confirmStake does nothing when the message index points at a message without actions', () => {
    component.messages.update(m => [...m, {
      role: 'assistant',
      content: 'Hey there! Ask me anything.',
      time: '10:00',
    }]);
    const greetingIdx = component.messages().length - 1;
    addActionMessage(stakeAction);

    component.confirmStake(greetingIdx, 0);

    expect(stakeMock.placeStake).not.toHaveBeenCalled();
  });

  it('confirmStake does nothing for an already cancelled or done action', () => {
    stakeMock.placeStake.and.returnValue(of({ success: true }));
    const msgIdx = addActionMessage(stakeAction);

    component.cancelStake(msgIdx, 0);
    component.confirmStake(msgIdx, 0);
    expect(stakeMock.placeStake).not.toHaveBeenCalled();

    const msgIdx2 = addActionMessage(stakeAction);
    component.confirmStake(msgIdx2, 0);
    component.confirmStake(msgIdx2, 0);
    expect(stakeMock.placeStake).toHaveBeenCalledTimes(1);
  });

  it('cancelStake marks the action as cancelled', () => {
    const msgIdx = addActionMessage(stakeAction);

    component.cancelStake(msgIdx, 0);

    expect(component.messages()[msgIdx].actionStates?.[0]).toBe('cancelled');
  });

  it('shows the business error message when Ora responds with one', () => {
    authMock.chatWithOra.and.returnValue(throwError(() => ({ error: { message: 'Betting is temporarily disabled' } })));

    component.inputText = 'bet 1000 on arsenal';
    component.sendMessage();

    const last = component.messages()[component.messages().length - 1];
    expect(last.content).toContain('Betting is temporarily disabled');
    expect(component.loading()).toBeFalse();
  });

  it('shows manual placement guidance when Ora service fails without a business message', () => {
    authMock.chatWithOra.and.returnValue(throwError(() => new Error('network down')));

    component.inputText = 'bet 1000 on arsenal';
    component.sendMessage();

    const last = component.messages()[component.messages().length - 1];
    expect(last.content).toContain('place it manually');
    expect(component.loading()).toBeFalse();
  });
});
