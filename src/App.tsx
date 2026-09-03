import React, { useState, useEffect } from 'react';
import {
  TimesheetDB,
  TimesheetDayData,
  LocationData,
  WorkerItem,
  UserAccount,
} from './types';
import {
  INITIAL_LOCATIONS_DATA,
  STORAGE_KEY,
} from './data/initialData';
import {
  getTodayFormatted,
  calculateDatesForStart,
  containsBale,
} from './utils/calculations';
import { CURRENT_USER_SESSION_KEY } from './utils/auth';

// Components
import { LoginOverlay } from './components/LoginOverlay';
import { Header } from './components/Header';
import { SiteControlBar } from './components/SiteControlBar';
import { RoleFilterBar } from './components/RoleFilterBar';
import { SiteAnalytics } from './components/SiteAnalytics';
import { OverallAnalytics } from './components/OverallAnalytics';
import { TimesheetTable } from './components/TimesheetTable';
import { ViewAllSitesTable } from './components/ViewAllSitesTable';
import { FooterBar } from './components/FooterBar';

// Modals
import { WorkerProfileModal } from './components/WorkerProfileModal';
import { SearchWorkerModal } from './components/SearchWorkerModal';
import { AddWorkerModal } from './components/AddWorkerModal';
import { CreateSiteModal } from './components/CreateSiteModal';
import { ClearRecordsModal } from './components/ClearRecordsModal';
import { DeleteRecordedDateModal } from './components/DeleteRecordedDateModal';
import { DeleteSiteModal } from './components/DeleteSiteModal';
import { ExportTxtModal } from './components/ExportTxtModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { CreateAccountModal } from './components/CreateAccountModal';

function generateBlankDefaultData(
  dateStr: string,
  referenceData?: TimesheetDayData
): TimesheetDayData {
  const newLocations: Record<string, LocationData> = {};
  let wCounter = 1;

  let locKeys = Object.keys(INITIAL_LOCATIONS_DATA);
  if (referenceData?.locations && Object.keys(referenceData.locations).length > 0) {
    locKeys = Object.keys(referenceData.locations);
  }

  locKeys.forEach((loc) => {
    newLocations[loc] = {
      baleValue: 0,
      isDone: false,
      siteRemarksHistory: referenceData?.locations[loc]?.siteRemarksHistory ? [...referenceData.locations[loc].siteRemarksHistory!] : [],
      workers: [],
    };

    if (referenceData?.locations[loc]?.workers && referenceData.locations[loc].workers.length > 0) {
      referenceData.locations[loc].workers.forEach((w) => {
        newLocations[loc].workers.push({
          id: w.id,
          name: w.name,
          role: w.role,
          baleValue: 0,
          notesHistory: w.notesHistory ? [...w.notesHistory] : [],
          attendance: { S: '', M: '', T: '', W: '', Th: '', F: '' },
          ot: { S: 0, M: 0, T: 0, W: 0, Th: 0, F: 0 },
        });
      });
    } else {
      const template = INITIAL_LOCATIONS_DATA[loc];
      if (template?.roles) {
        for (const role in template.roles) {
          template.roles[role].forEach((name) => {
            newLocations[loc].workers.push({
              id: 'w_' + wCounter++,
              name,
              role,
              baleValue: 0,
              notesHistory: [],
              attendance: { S: '', M: '', T: '', W: '', Th: '', F: '' },
              ot: { S: 0, M: 0, T: 0, W: 0, Th: 0, F: 0 },
            });
          });
        }
      }
    }
  });

  return {
    startDate: dateStr,
    locations: newLocations,
    roleBales: {},
  };
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('arcdesign_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const raw = sessionStorage.getItem(CURRENT_USER_SESSION_KEY);
      if (raw) return JSON.parse(raw);
      if (sessionStorage.getItem('arcdesign_logged_in') === 'true') {
        return { username: 'Admin', role: 'admin', password: '' };
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [timesheetDB, setTimesheetDB] = useState<TimesheetDB>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }
    return {};
  });

  const [currentDate, setCurrentDate] = useState<string>(() => getTodayFormatted());
  const [currentLocation, setCurrentLocation] = useState<string>('SAN JOSEF');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showStats, setShowStats] = useState<boolean>(false);

  // Modals state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [isSearchWorkerModalOpen, setIsSearchWorkerModalOpen] = useState(false);
  const [isAddWorkerModalOpen, setIsAddWorkerModalOpen] = useState(false);
  const [isCreateSiteModalOpen, setIsCreateSiteModalOpen] = useState(false);
  const [isClearRecordsModalOpen, setIsClearRecordsModalOpen] = useState(false);
  const [isDeleteRecordedDateModalOpen, setIsDeleteRecordedDateModalOpen] = useState(false);
  const [isDeleteSiteModalOpen, setIsDeleteSiteModalOpen] = useState(false);
  const [isCreateAccountModalOpen, setIsCreateAccountModalOpen] = useState(false);
  const [workerProfileTarget, setWorkerProfileTarget] = useState<{ id: string; name: string } | null>(null);

  // Ensure current date exists in timesheetDB
  useEffect(() => {
    setTimesheetDB((prev) => {
      if (prev[currentDate]) {
        return prev;
      }
      // Pick any existing day data as reference, or first
      const referenceKey = Object.keys(prev)[0];
      const referenceData = referenceKey ? prev[referenceKey] : undefined;
      const newDayData = generateBlankDefaultData(currentDate, referenceData);
      const updated = { ...prev, [currentDate]: newDayData };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage error', e);
      }
      return updated;
    });
  }, [currentDate]);

  // Persist timesheetDB updates
  const saveTimesheetDB = (newDB: TimesheetDB) => {
    setTimesheetDB(newDB);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDB));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  const currentDayData = timesheetDB[currentDate];

  // Helper to check if current date has any recorded attendance
  const hasRecordForCurrentDate = Boolean(
    currentDayData?.locations &&
      Object.values(currentDayData.locations).some((loc: LocationData) =>
        loc.workers?.some(
          (w: WorkerItem) =>
            Object.values(w.attendance).some((val) => val !== '') ||
            w.baleValue > 0
        )
      )
  );

  const locationsList = currentDayData?.locations
    ? Object.keys(currentDayData.locations)
    : Object.keys(INITIAL_LOCATIONS_DATA);

  // If currentLocation is not in locationsList and not VIEW_ALL, reset to first
  useEffect(() => {
    if (
      currentLocation !== 'VIEW_ALL' &&
      locationsList.length > 0 &&
      !locationsList.includes(currentLocation)
    ) {
      setCurrentLocation(locationsList[0]);
    }
  }, [locationsList, currentLocation]);

  const dates = calculateDatesForStart(currentDate);
  const dateRangeStr =
    dates.length > 0
      ? `Week Period: ${dates[0].fullDateStr} - ${dates[dates.length - 1].fullDateStr}`
      : `Week Period: ${currentDate}`;

  // Recorded dates for dropdown
  const allRecordedDates = Array.from(
    new Set([currentDate, ...Object.keys(timesheetDB)])
  ).sort().reverse();

  // Role filter toggle
  const handleToggleRole = (role: string) => {
    if (role === 'ALL') {
      setSelectedRoles([]);
    } else {
      setSelectedRoles((prev) =>
        prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
      );
    }
  };

  // Location bale update
  const handleUpdateLocationBale = (val: number) => {
    if (currentLocation === 'VIEW_ALL' || !currentDayData) return;
    const updated = {
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: {
          ...currentDayData.locations,
          [currentLocation]: {
            ...currentDayData.locations[currentLocation],
            baleValue: val,
          },
        },
      },
    };
    saveTimesheetDB(updated);
  };

  // Location Done toggle
  const handleToggleLocationDone = (isDone: boolean) => {
    if (currentLocation === 'VIEW_ALL' || !currentDayData) return;
    const updated = {
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: {
          ...currentDayData.locations,
          [currentLocation]: {
            ...currentDayData.locations[currentLocation],
            isDone,
          },
        },
      },
    };
    saveTimesheetDB(updated);
  };

  // Role bale update
  const handleUpdateRoleBale = (loc: string, role: string, val: number) => {
    if (!currentDayData) return;
    const key = `${loc}_${role}`;
    const updatedLocations = { ...currentDayData.locations };
    if (updatedLocations[loc]) {
      const workers = updatedLocations[loc].workers.map((w) => {
        if (w.role === role || (containsBale(role) && containsBale(w.role))) {
          return { ...w, baleValue: val };
        }
        return w;
      });
      updatedLocations[loc] = { ...updatedLocations[loc], workers };
    }

    const updated = {
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
        roleBales: {
          ...(currentDayData.roleBales || {}),
          [key]: val,
        },
      },
    };
    saveTimesheetDB(updated);
  };

  // Worker bale update
  const handleUpdateWorkerBale = (workerId: string, val: number) => {
    if (!currentDayData) return;
    const updatedLocations = { ...currentDayData.locations };
    for (const loc in updatedLocations) {
      const workers = [...updatedLocations[loc].workers];
      const wIdx = workers.findIndex((x) => x.id === workerId);
      if (wIdx !== -1) {
        workers[wIdx] = {
          ...workers[wIdx],
          baleValue: val,
        };
        updatedLocations[loc] = { ...updatedLocations[loc], workers };
        break;
      }
    }
    saveTimesheetDB({
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
      },
    });
  };

  // Attendance update
  const handleUpdateAttendance = (workerId: string, dayKey: string, value: string) => {
    if (!currentDayData) return;
    const isFullOrHalf = value === '1.0' || value === '0.5';
    const updatedLocations = { ...currentDayData.locations };
    for (const loc in updatedLocations) {
      const workers = [...updatedLocations[loc].workers];
      const wIdx = workers.findIndex((x) => x.id === workerId);
      if (wIdx !== -1) {
        const workerObj = workers[wIdx];
        const updatedOt = { ...workerObj.ot };
        // OT only applies to fullday or halfday
        if (!isFullOrHalf) {
          delete updatedOt[dayKey];
        }

        workers[wIdx] = {
          ...workerObj,
          attendance: {
            ...workerObj.attendance,
            [dayKey]: value,
          },
          ot: updatedOt,
        };
        updatedLocations[loc] = { ...updatedLocations[loc], workers };
        break;
      }
    }
    saveTimesheetDB({
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
      },
    });
  };

  // Overtime update
  const handleUpdateOT = (workerId: string, dayKey: string, value: number) => {
    if (!currentDayData) return;
    const updatedLocations = { ...currentDayData.locations };
    for (const loc in updatedLocations) {
      const workers = [...updatedLocations[loc].workers];
      const wIdx = workers.findIndex((x) => x.id === workerId);
      if (wIdx !== -1) {
        const currentAtt = workers[wIdx].attendance[dayKey] || '';
        // Guard rule: OT only allowed when fullday or halfday is selected
        if (currentAtt !== '1.0' && currentAtt !== '0.5') {
          return;
        }

        workers[wIdx] = {
          ...workers[wIdx],
          ot: {
            ...workers[wIdx].ot,
            [dayKey]: value,
          },
        };
        updatedLocations[loc] = { ...updatedLocations[loc], workers };
        break;
      }
    }
    saveTimesheetDB({
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
      },
    });
  };

  // Delete worker from site
  const handleDeleteWorker = (workerId: string) => {
    if (!confirm('Are you sure you want to remove this worker from this site?')) return;
    if (!currentDayData) return;
    const updatedLocations = { ...currentDayData.locations };
    for (const loc in updatedLocations) {
      const workers = updatedLocations[loc].workers.filter((x) => x.id !== workerId);
      updatedLocations[loc] = { ...updatedLocations[loc], workers };
    }
    saveTimesheetDB({
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
      },
    });
  };

  // Add worker to site
  const handleAddWorker = (name: string, role: string) => {
    if (currentLocation === 'VIEW_ALL' || !currentDayData) return;
    const locData = currentDayData.locations[currentLocation];
    if (!locData) return;

    const newWorker: WorkerItem = {
      id: 'w_' + Date.now(),
      name,
      role,
      baleValue: 0,
      notesHistory: [],
      attendance: { S: '', M: '', T: '', W: '', Th: '', F: '' },
      ot: { S: 0, M: 0, T: 0, W: 0, Th: 0, F: 0 },
    };

    const updated = {
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: {
          ...currentDayData.locations,
          [currentLocation]: {
            ...locData,
            workers: [...locData.workers, newWorker],
          },
        },
      },
    };
    saveTimesheetDB(updated);
  };

  // Create site
  const handleCreateSite = (name: string) => {
    if (currentDayData?.locations[name]) {
      alert('This project location already exists!');
      return;
    }

    const newDB: TimesheetDB = { ...timesheetDB };
    for (const dKey in newDB) {
      if (newDB[dKey]?.locations && !newDB[dKey].locations[name]) {
        newDB[dKey] = {
          ...newDB[dKey],
          locations: {
            ...newDB[dKey].locations,
            [name]: {
              baleValue: 0,
              isDone: false,
              siteRemarksHistory: [],
              workers: [],
            },
          },
        };
      }
    }

    if (!newDB[currentDate]) {
      newDB[currentDate] = generateBlankDefaultData(currentDate);
    }
    newDB[currentDate].locations[name] = {
      baleValue: 0,
      isDone: false,
      siteRemarksHistory: [],
      workers: [],
    };

    setCurrentLocation(name);
    saveTimesheetDB(newDB);
  };

  // Delete site
  const handleDeleteSite = () => {
    if (currentLocation === 'VIEW_ALL') return;
    const locToDelete = currentLocation;
    const newDB: TimesheetDB = { ...timesheetDB };

    for (const dKey in newDB) {
      if (newDB[dKey]?.locations?.[locToDelete]) {
        const { [locToDelete]: removed, ...remainingLocations } = newDB[dKey].locations;
        newDB[dKey] = {
          ...newDB[dKey],
          locations: remainingLocations,
        };
      }
    }

    const remainingKeys = Object.keys(newDB[currentDate]?.locations || {});
    setCurrentLocation(remainingKeys.length > 0 ? remainingKeys[0] : 'VIEW_ALL');
    saveTimesheetDB(newDB);
  };

  // Clear records for current timeframe
  const handleClearRecords = () => {
    if (!currentDayData) return;
    const newDB = { ...timesheetDB };

    if (currentLocation === 'VIEW_ALL') {
      newDB[currentDate] = generateBlankDefaultData(currentDate, currentDayData);
    } else {
      const locData = currentDayData.locations[currentLocation];
      if (locData) {
        const clearedWorkers = locData.workers.map((w) => ({
          ...w,
          baleValue: 0,
          attendance: { S: '', M: '', T: '', W: '', Th: '', F: '' },
          ot: { S: 0, M: 0, T: 0, W: 0, Th: 0, F: 0 },
        }));

        newDB[currentDate] = {
          ...currentDayData,
          locations: {
            ...currentDayData.locations,
            [currentLocation]: {
              ...locData,
              baleValue: 0,
              isDone: false,
              workers: clearedWorkers,
            },
          },
        };
      }
    }

    saveTimesheetDB(newDB);
  };

  // Delete recorded date block
  const handleDeleteRecordedDate = () => {
    const newDB = { ...timesheetDB };
    delete newDB[currentDate];

    const savedKeys = Object.keys(newDB).sort().reverse();
    const nextDate = savedKeys.length > 0 ? savedKeys[0] : getTodayFormatted();
    if (!newDB[nextDate]) {
      newDB[nextDate] = generateBlankDefaultData(nextDate);
    }

    setCurrentDate(nextDate);
    saveTimesheetDB(newDB);
  };

  // Site Remark Add
  const handleAddSiteRemark = (text: string) => {
    if (currentLocation === 'VIEW_ALL' || !currentDayData) return;
    const locData = currentDayData.locations[currentLocation];
    if (!locData) return;

    const newRemark = {
      id: 'sr_' + Date.now(),
      text,
      date: currentDate,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };

    const updated = {
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: {
          ...currentDayData.locations,
          [currentLocation]: {
            ...locData,
            siteRemarksHistory: [...(locData.siteRemarksHistory || []), newRemark],
          },
        },
      },
    };
    saveTimesheetDB(updated);
  };

  // Site Remark Delete
  const handleDeleteSiteRemark = (remarkId: string) => {
    if (currentLocation === 'VIEW_ALL' || !currentDayData) return;
    const locData = currentDayData.locations[currentLocation];
    if (!locData) return;

    const updated = {
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: {
          ...currentDayData.locations,
          [currentLocation]: {
            ...locData,
            siteRemarksHistory: (locData.siteRemarksHistory || []).filter(
              (r) => r.id !== remarkId
            ),
          },
        },
      },
    };
    saveTimesheetDB(updated);
  };

  // Worker Note Add
  const handleAddWorkerNote = (workerId: string, text: string) => {
    if (!currentDayData) return;
    const newNote = {
      id: 'note_' + Date.now(),
      text,
      date: currentDate,
      timestamp: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    };

    const updatedLocations = { ...currentDayData.locations };
    for (const loc in updatedLocations) {
      const workers = [...updatedLocations[loc].workers];
      const wIdx = workers.findIndex((x) => x.id === workerId);
      if (wIdx !== -1) {
        workers[wIdx] = {
          ...workers[wIdx],
          notesHistory: [...(workers[wIdx].notesHistory || []), newNote],
        };
        updatedLocations[loc] = { ...updatedLocations[loc], workers };
        break;
      }
    }

    saveTimesheetDB({
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
      },
    });
  };

  // Worker Note Delete
  const handleDeleteWorkerNote = (workerId: string, noteId: string) => {
    if (!currentDayData) return;
    const updatedLocations = { ...currentDayData.locations };
    for (const loc in updatedLocations) {
      const workers = [...updatedLocations[loc].workers];
      const wIdx = workers.findIndex((x) => x.id === workerId);
      if (wIdx !== -1) {
        workers[wIdx] = {
          ...workers[wIdx],
          notesHistory: (workers[wIdx].notesHistory || []).filter(
            (n) => n.id !== noteId
          ),
        };
        updatedLocations[loc] = { ...updatedLocations[loc], workers };
        break;
      }
    }

    saveTimesheetDB({
      ...timesheetDB,
      [currentDate]: {
        ...currentDayData,
        locations: updatedLocations,
      },
    });
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('arcdesign_logged_in');
      sessionStorage.removeItem(CURRENT_USER_SESSION_KEY);
    } catch {
      // ignore
    }
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const currentLocData =
    currentLocation !== 'VIEW_ALL' && currentDayData?.locations
      ? currentDayData.locations[currentLocation]
      : null;

  return (
    <div className="min-h-screen bg-[#f4f5f7] text-[#0d0d0d] font-sans antialiased">
      {/* Login Screen Overlay */}
      <LoginOverlay
        isOpen={!isAuthenticated}
        onLoginSuccess={(account) => {
          setCurrentUser(account);
          setIsAuthenticated(true);
        }}
      />

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-4 pb-12" id="exportArea">
        {/* Main Header */}
        <Header
          currentDate={currentDate}
          currentLocation={currentLocation}
          locationsList={locationsList}
          timesheetDB={timesheetDB}
          onDateChange={(newDate) => setCurrentDate(newDate)}
          onLocationChange={(newLoc) => {
            setCurrentLocation(newLoc);
            if (newLoc === 'VIEW_ALL') {
              setShowStats(true);
            }
          }}
          onOpenExportModal={() => setIsExportModalOpen(true)}
          onOpenExportPdfModal={() => setIsExportPdfModalOpen(true)}
          hasRecordForDate={hasRecordForCurrentDate}
        />

        {/* Site Control Bar & Role Filters */}
        <div className="mb-4">
          <SiteControlBar
            currentLocation={currentLocation}
            isDone={Boolean(currentLocData?.isDone)}
            baleValue={currentLocData?.baleValue || 0}
            showStats={showStats}
            currentDate={currentDate}
            recordedDates={allRecordedDates}
            dateRangeStr={dateRangeStr}
            onToggleDone={handleToggleLocationDone}
            onToggleStats={() => setShowStats((prev) => !prev)}
            onUpdateBale={handleUpdateLocationBale}
            onSelectRecordedDate={(d) => setCurrentDate(d)}
            onOpenCreateSiteModal={() => setIsCreateSiteModalOpen(true)}
            onOpenClearRecordsModal={() => setIsClearRecordsModalOpen(true)}
            onOpenDeleteSiteModal={() => setIsDeleteSiteModalOpen(true)}
            onOpenDeleteRecordedDateModal={() => setIsDeleteRecordedDateModalOpen(true)}
          />

          <RoleFilterBar
            selectedRoles={selectedRoles}
            onToggleRole={handleToggleRole}
            onOpenSearchWorkerModal={() => setIsSearchWorkerModalOpen(true)}
            onOpenAddWorkerModal={() => setIsAddWorkerModalOpen(true)}
            isViewAll={currentLocation === 'VIEW_ALL'}
          />
        </div>

        {/* Toggleable Analytics Section */}
        {showStats && (
          currentLocation === 'VIEW_ALL' ? (
            <OverallAnalytics
              locations={currentDayData?.locations || {}}
              roleBales={currentDayData?.roleBales || {}}
              selectedRoles={selectedRoles}
              currentDate={currentDate}
              onSelectLocation={(loc) => setCurrentLocation(loc)}
            />
          ) : currentLocData ? (
            <SiteAnalytics
              currentLocation={currentLocation}
              locData={currentLocData}
              selectedRoles={selectedRoles}
              currentDate={currentDate}
              onAddSiteRemark={handleAddSiteRemark}
              onDeleteSiteRemark={handleDeleteSiteRemark}
              onAddWorkerNote={handleAddWorkerNote}
              onDeleteWorkerNote={handleDeleteWorkerNote}
            />
          ) : null
        )}

        {/* Main Timesheet Display */}
        {currentLocation === 'VIEW_ALL' ? (
          <ViewAllSitesTable
            locations={currentDayData?.locations || {}}
            dates={dates}
            selectedRoles={selectedRoles}
          />
        ) : (
          currentLocData && (
            <TimesheetTable
              currentLocation={currentLocation}
              locData={currentLocData}
              dates={dates}
              selectedRoles={selectedRoles}
              roleBales={currentDayData?.roleBales || {}}
              onUpdateAttendance={handleUpdateAttendance}
              onUpdateOT={handleUpdateOT}
              onUpdateRoleBale={handleUpdateRoleBale}
              onUpdateWorkerBale={handleUpdateWorkerBale}
              onDeleteWorker={handleDeleteWorker}
              onOpenWorkerProfile={(id, name) =>
                setWorkerProfileTarget({ id, name })
              }
              onResetRoleFilter={() => setSelectedRoles([])}
            />
          )
        )}

        {/* Footer Account Status */}
        <FooterBar
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenCreateAccount={() => setIsCreateAccountModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <CreateAccountModal
        isOpen={isCreateAccountModalOpen && currentUser?.role === 'admin'}
        onClose={() => setIsCreateAccountModalOpen(false)}
      />

      <ExportTxtModal
        isOpen={isExportModalOpen}
        currentDate={currentDate}
        timesheetDB={timesheetDB}
        onClose={() => setIsExportModalOpen(false)}
      />

      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        currentLocation={currentLocation}
        currentDate={currentDate}
        locData={currentLocData}
        locationsList={locationsList}
        timesheetDB={timesheetDB}
        roleBales={currentDayData?.roleBales || {}}
      />

      <SearchWorkerModal
        isOpen={isSearchWorkerModalOpen}
        currentDayData={currentDayData}
        onClose={() => setIsSearchWorkerModalOpen(false)}
        onSelectWorker={(id, name) => setWorkerProfileTarget({ id, name })}
      />

      <AddWorkerModal
        isOpen={isAddWorkerModalOpen}
        currentLocation={currentLocation}
        onClose={() => setIsAddWorkerModalOpen(false)}
        onAddWorker={handleAddWorker}
      />

      <CreateSiteModal
        isOpen={isCreateSiteModalOpen}
        onClose={() => setIsCreateSiteModalOpen(false)}
        onCreateSite={handleCreateSite}
      />

      <ClearRecordsModal
        isOpen={isClearRecordsModalOpen}
        timeframeStr={dateRangeStr}
        onClose={() => setIsClearRecordsModalOpen(false)}
        onConfirmClear={handleClearRecords}
      />

      <DeleteRecordedDateModal
        isOpen={isDeleteRecordedDateModalOpen}
        dateRangeDisplay={`${dateRangeStr} (${currentDate})`}
        onClose={() => setIsDeleteRecordedDateModalOpen(false)}
        onConfirmDelete={handleDeleteRecordedDate}
      />

      <DeleteSiteModal
        isOpen={isDeleteSiteModalOpen}
        siteName={currentLocation}
        onClose={() => setIsDeleteSiteModalOpen(false)}
        onConfirmDelete={handleDeleteSite}
      />

      {workerProfileTarget && (
        <WorkerProfileModal
          isOpen={Boolean(workerProfileTarget)}
          workerId={workerProfileTarget.id}
          workerName={workerProfileTarget.name}
          timesheetDB={timesheetDB}
          currentDate={currentDate}
          onClose={() => setWorkerProfileTarget(null)}
          onAddNote={handleAddWorkerNote}
          onDeleteNote={handleDeleteWorkerNote}
        />
      )}
    </div>
  );
}
