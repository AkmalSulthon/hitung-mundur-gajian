(function () {
  'use strict';

  const STORAGE_KEY = 'paydayDate';
  const DEFAULT_PAYDAY = 10;
  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const daysRemainingElement = document.getElementById('days-remaining');
  const timeRemainingElement = document.getElementById('time-remaining');
  const targetDateElement = document.getElementById('target-date');
  const settingsButton = document.getElementById('settings-button');
  const dialog = document.getElementById('settings-dialog');
  const form = document.getElementById('settings-form');
  const select = document.getElementById('payday-select');
  const cancelButton = document.getElementById('cancel-button');
  const closeDialogButton = document.getElementById('close-dialog-button');

  let paydayDate = readPaydayDate();

  for (let day = 1; day <= 31; day += 1) {
    const option = document.createElement('option');
    option.value = String(day);
    option.textContent = String(day);
    select.appendChild(option);
  }

  function readPaydayDate() {
    let storedValue;
    try {
      storedValue = localStorage.getItem(STORAGE_KEY);
    } catch (error) {
      return DEFAULT_PAYDAY;
    }

    const value = Number(storedValue);
    return Number.isInteger(value) && value >= 1 && value <= 31 ? value : DEFAULT_PAYDAY;
  }

  function daysInMonth(year, monthIndex) {
    return new Date(year, monthIndex + 1, 0).getDate();
  }

  function getPaydayStatus(now, preferredDay) {
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = Math.min(preferredDay, daysInMonth(year, month));
    let target = new Date(year, month, day, 0, 0, 0, 0);

    const isToday = target.getFullYear() === now.getFullYear()
      && target.getMonth() === now.getMonth()
      && target.getDate() === now.getDate();

    if (isToday || target > now) {
      return { target, isToday };
    }

    month += 1;
    if (month > 11) { month = 0; year += 1; }
    day = Math.min(preferredDay, daysInMonth(year, month));
    target = new Date(year, month, day, 0, 0, 0, 0);
    return { target, isToday: false };
  }

  function calendarDayDifference(from, to) {
    const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.max(0, Math.round((toUtc - fromUtc) / 86400000));
  }

  function pad(value) { return String(value).padStart(2, '0'); }

  function render() {
    const now = new Date();
    const paydayStatus = getPaydayStatus(now, paydayDate);
    const target = paydayStatus.target;
    daysRemainingElement.classList.toggle('is-today', paydayStatus.isToday);
    if (paydayStatus.isToday) {
      daysRemainingElement.textContent = 'Hari Ini Gajian!';
      timeRemainingElement.textContent = '00:00:00:00';
      timeRemainingElement.setAttribute('aria-label', 'Hari ini gajian');
      targetDateElement.textContent = `Gajian · ${target.getDate()} ${MONTH_NAMES[target.getMonth()]} ${target.getFullYear()}`;
      return;
    }

    const millisecondsLeft = Math.max(0, target.getTime() - now.getTime());
    const totalSeconds = Math.floor(millisecondsLeft / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const calendarDays = calendarDayDifference(now, target);

    daysRemainingElement.textContent = `H-${calendarDays}`;
    timeRemainingElement.textContent = `${pad(days)}:${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    timeRemainingElement.setAttribute('aria-label', `${days} hari, ${hours} jam, ${minutes} menit, ${seconds} detik`);
    targetDateElement.textContent = `Gajian · ${target.getDate()} ${MONTH_NAMES[target.getMonth()]} ${target.getFullYear()}`;
  }

  function openSettings() {
    select.value = String(paydayDate);
    dialog.showModal();
    select.focus();
  }

  function closeSettings() {
    dialog.close();
  }

  settingsButton.addEventListener('click', openSettings);
  cancelButton.addEventListener('click', closeSettings);
  closeDialogButton.addEventListener('click', closeSettings);
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const selectedDay = Number.parseInt(select.value, 10);
    if (!Number.isInteger(selectedDay) || selectedDay < 1 || selectedDay > 31) return;
    paydayDate = selectedDay;
    try {
      localStorage.setItem(STORAGE_KEY, String(paydayDate));
    } catch (error) {
      // Countdown tetap dapat digunakan jika penyimpanan browser diblokir.
    }
    closeSettings();
    render();
  });
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeSettings();
  });

  render();
  setInterval(render, 1000);
})();
