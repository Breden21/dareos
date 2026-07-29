import React, { useState } from "react";
import {
  LayoutDashboard, Receipt, FolderOpen, MessageSquare, Users,
  Wallet, ClipboardList, UserCircle, MapPin, Truck,
} from "lucide-react";
import type { Account, RevenueSub, TabKey } from "./lib/types";
import { Header, BottomNav, Topbar, type TabDef } from "./components/layout/Shell";
import { Sidebar } from "./components/layout/Sidebar";
import { LoginScreen } from "./screens/LoginScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { CeoDashboard } from "./screens/CeoDashboard";
import { RevenueScreen } from "./screens/revenue/RevenueScreen";
import { RecordsScreen } from "./screens/RecordsScreen";
import { WardScreen } from "./screens/WardScreen";
import { MoreScreen } from "./screens/MoreScreen";
import { CollectorToday } from "./screens/CollectorToday";
import { CollectorHistory } from "./screens/CollectorHistory";
import { WardOfficerHome } from "./screens/WardOfficerHome";
import { DriverHome } from "./screens/DriverHome";

const ROLE_GROUPS: Record<string, { label: string; tabs: TabDef[] }[]> = {
  ceo: [
    { label: "Overview", tabs: [{ key: "dashboard", label: "Dashboard", icon: LayoutDashboard, title: "Dashboard" }] },
    {
      label: "Operations",
      tabs: [
        { key: "revenue", label: "Revenue", icon: Receipt, title: "Revenue" },
        { key: "records", label: "Records", icon: FolderOpen, title: "Records" },
        { key: "ward", label: "Ward", icon: MessageSquare, title: "Ward reports" },
      ],
    },
    { label: "Administration", tabs: [{ key: "more", label: "Fleet & Staff", icon: Users, title: "Fleet & staff" }] },
  ],
  collector: [
    {
      label: "Collection",
      tabs: [
        { key: "today", label: "Today", icon: Wallet, title: "My collection point" },
        { key: "history", label: "History", icon: ClipboardList, title: "My receipts" },
      ],
    },
    { label: "Account", tabs: [{ key: "profile", label: "Profile", icon: UserCircle, title: "Profile" }] },
  ],
  ward_officer: [
    { label: "My Ward", tabs: [{ key: "ward_home", label: "My Ward", icon: MapPin, title: "My ward" }] },
    { label: "Account", tabs: [{ key: "profile", label: "Profile", icon: UserCircle, title: "Profile" }] },
  ],
  driver: [
    { label: "My Vehicle", tabs: [{ key: "vehicle_home", label: "My Vehicle", icon: Truck, title: "My vehicle" }] },
    { label: "Account", tabs: [{ key: "profile", label: "Profile", icon: UserCircle, title: "Profile" }] },
  ],
  records_clerk: [
    { label: "Records", tabs: [{ key: "records_home", label: "Records", icon: FolderOpen, title: "Digitization queue" }] },
    { label: "Account", tabs: [{ key: "profile", label: "Profile", icon: UserCircle, title: "Profile" }] },
  ],
};

export default function App() {
  const [account, setAccount] = useState<Account | null>(null);
  const [tab, setTab] = useState<TabKey | null>(null);
  const [revenueSub, setRevenueSub] = useState<RevenueSub>("overview");

  function handleLogin(acc: Account) {
    setAccount(acc);
    setTab(ROLE_GROUPS[acc.role][0].tabs[0].key);
  }
  function handleLogout() {
    setAccount(null);
    setTab(null);
  }
  function goTo(t: string, sub?: string) {
    setTab(t as TabKey);
    if (t === "revenue" && sub) setRevenueSub(sub as RevenueSub);
  }

  if (!account || !tab) return <LoginScreen onLogin={handleLogin} />;

  const groups = ROLE_GROUPS[account.role];
  const allTabs = groups.flatMap((g) => g.tabs);
  const activeTabDef = allTabs.find((t) => t.key === tab) ?? allTabs[0];
  const accountLabel = `${account.name.toUpperCase()} · ${account.roleLabel.toUpperCase()}`;

  function renderScreen() {
    if (tab === "profile") return <ProfileScreen account={account!} onLogout={handleLogout} />;
    if (account!.role === "ceo") {
      if (tab === "dashboard") return <CeoDashboard account={account!} onGo={goTo} />;
      if (tab === "revenue") return <RevenueScreen initialSub={revenueSub} />;
      if (tab === "records") return <RecordsScreen showCaptureAction={false} />;
      if (tab === "ward") return <WardScreen />;
      if (tab === "more") return <MoreScreen />;
    }
    if (account!.role === "collector") {
      if (tab === "today") return <CollectorToday account={account!} />;
      if (tab === "history") return <CollectorHistory account={account!} />;
    }
    if (account!.role === "ward_officer" && tab === "ward_home") return <WardOfficerHome account={account!} />;
    if (account!.role === "driver" && tab === "vehicle_home") return <DriverHome account={account!} />;
    if (account!.role === "records_clerk" && tab === "records_home") return <RecordsScreen />;
    return null;
  }

  return (
    <div className="min-h-screen bg-bg font-sans text-ink lg:flex">
      <Sidebar groups={groups} active={tab} onChange={setTab} account={account} onLogout={handleLogout} />

      <div className="flex-1 min-w-0">
        <Header accountLabel={accountLabel} title={activeTabDef.title} onLogout={handleLogout} />
        <Topbar title={activeTabDef.title} account={account} />
        <main>{renderScreen()}</main>
        <BottomNav tabs={allTabs} active={tab} onChange={setTab} />
      </div>
    </div>
  );
}
