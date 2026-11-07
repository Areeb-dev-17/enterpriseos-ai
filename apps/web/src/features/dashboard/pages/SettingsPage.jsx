
import { useMemo, useState } from "react";
import {
  User,
  Building2,
  Users,
  Package,
  Bell,
  Palette,
  Save,
  Check,
  Plus,
  Search,
  MoreHorizontal,
  X,
  ShieldCheck,
  Mail,
  CalendarDays,
  Pencil,
} from "lucide-react";

const settingsSections = [
  { id: "profile", label: "My Profile", icon: User },
  { id: "organization", label: "Organization", icon: Building2 },
  { id: "members", label: "Team Members", icon: Users },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "appearance", label: "Appearance", icon: Palette },
];

const initialMembers = [
  {
    id: "member-1",
    name: "Syed Areeb",
    email: "areeb@example.com",
    role: "Admin",
    joinedAt: "Oct 12, 2026",
  },
  {
    id: "member-2",
    name: "Rahul Sharma",
    email: "rahul@example.com",
    role: "Manager",
    joinedAt: "Oct 18, 2026",
  },
  {
    id: "member-3",
    name: "Ahmed Khan",
    email: "ahmed@example.com",
    role: "Member",
    joinedAt: "Oct 21, 2026",
  },
  {
    id: "member-4",
    name: "Priya Singh",
    email: "priya@example.com",
    role: "Member",
    joinedAt: "Oct 25, 2026",
  },
];

function SettingsField({ label, children, hint }) {
  return (
    <label className="settings-field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SettingsToggle({ title, description, checked, onChange }) {
  return (
    <div className="settings-toggle-row">
      <div className="settings-toggle-copy">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className={`settings-switch ${checked ? "active" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span />
      </button>
    </div>
  );
}

function SectionHeading({ title, description, action }) {
  return (
    <div className="settings-section-heading">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function SettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberForm, setMemberForm] = useState({
    name: "",
    email: "",
    role: "Member",
  });

  const [members, setMembers] = useState(initialMembers);

  const [settings, setSettings] = useState({
    fullName: "Syed Areeb",
    email: "areeb@example.com",
    jobTitle: "Administrator",
    phone: "",
    companyName: "EnterpriseOS Demo",
    organizationSlug: "enterpriseos-demo",
    industry: "Retail",
    timezone: "Asia/Kolkata",
    currency: "INR",
    defaultReorderLevel: "50",
    lowStockAlerts: true,
    outOfStockAlerts: true,
    purchaseOrderAlerts: true,
    emailNotifications: true,
    inAppNotifications: true,
    weeklyReports: false,
    theme: "dark",
    compactSidebar: false,
  });

  const updateSetting = (name, value) => {
    setSettings((current) => ({
      ...current,
      [name]: value,
    }));
    setSaved(false);
  };

  const filteredMembers = useMemo(() => {
    const query = memberSearch.toLowerCase().trim();

    if (!query) return members;

    return members.filter((member) =>
      `${member.name} ${member.email} ${member.role}`
        .toLowerCase()
        .includes(query)
    );
  }, [members, memberSearch]);

  const updateMemberRole = (memberId, role) => {
    setMembers((current) =>
      current.map((member) =>
        member.id === memberId ? { ...member, role } : member
      )
    );
    setSaved(false);
  };

  const addMember = (event) => {
    event.preventDefault();

    const name = memberForm.name.trim();
    const email = memberForm.email.trim().toLowerCase();

    if (!name || !email) return;

    if (members.some((member) => member.email.toLowerCase() === email)) {
      return;
    }

    const newMember = {
      id: `member-${Date.now()}`,
      name,
      email,
      role: memberForm.role,
      joinedAt: new Date().toLocaleDateString("en-IN", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      }),
    };

    setMembers((current) => [newMember, ...current]);
    setMemberForm({ name: "", email: "", role: "Member" });
    setShowAddMember(false);
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
  };

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return (
          <>
            <SectionHeading
              title="My Profile"
              description="Manage your personal account information."
            />

            <div className="settings-profile-card">
              <div className="settings-avatar">
                {getInitials(settings.fullName) || "U"}
              </div>

              <div className="settings-profile-info">
                <strong>{settings.fullName || "Your Name"}</strong>
                <p>{settings.email}</p>
                <span>
                  <ShieldCheck size={13} />
                  Administrator account
                </span>
              </div>

              <div className="settings-profile-status">
                <span className="settings-status-dot" />
                Active
              </div>
            </div>

            <div className="settings-subsection-title">
              <h3>Personal Information</h3>
              <p>These details identify you across your workspace.</p>
            </div>

            <div className="settings-form-grid">
              <SettingsField label="Full Name">
                <input
                  value={settings.fullName}
                  onChange={(e) =>
                    updateSetting("fullName", e.target.value)
                  }
                  placeholder="Enter your name"
                />
              </SettingsField>

              <SettingsField label="Email Address">
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) =>
                    updateSetting("email", e.target.value)
                  }
                  placeholder="Enter your email"
                />
              </SettingsField>

              <SettingsField label="Job Title">
                <input
                  value={settings.jobTitle}
                  onChange={(e) =>
                    updateSetting("jobTitle", e.target.value)
                  }
                  placeholder="Enter your job title"
                />
              </SettingsField>

              <SettingsField label="Phone Number">
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) =>
                    updateSetting("phone", e.target.value)
                  }
                  placeholder="+91 00000 00000"
                />
              </SettingsField>
            </div>
          </>
        );

      case "organization":
        return (
          <>
            <SectionHeading
              title="Organization"
              description="Manage your company workspace information."
            />

            <div className="settings-organization-card">
              <div className="settings-organization-icon">
                <Building2 size={23} />
              </div>
              <div>
                <strong>{settings.companyName}</strong>
                <p>Organization workspace</p>
              </div>
              <span className="settings-plan-label">WORKSPACE</span>
            </div>

            <div className="settings-subsection-title">
              <h3>Organization Information</h3>
              <p>Basic information about your business.</p>
            </div>

            <div className="settings-form-grid">
              <SettingsField label="Organization Name">
                <input
                  value={settings.companyName}
                  onChange={(e) =>
                    updateSetting("companyName", e.target.value)
                  }
                  placeholder="Company name"
                />
              </SettingsField>

              <SettingsField
                label="Organization Slug"
                hint="Used as a unique workspace identifier."
              >
                <input
                  value={settings.organizationSlug}
                  onChange={(e) =>
                    updateSetting("organizationSlug", e.target.value)
                  }
                  placeholder="organization-slug"
                />
              </SettingsField>

              <SettingsField label="Industry">
                <select
                  value={settings.industry}
                  onChange={(e) =>
                    updateSetting("industry", e.target.value)
                  }
                >
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="E-commerce">E-commerce</option>
                  <option value="Wholesale">Wholesale</option>
                  <option value="Other">Other</option>
                </select>
              </SettingsField>

              <SettingsField label="Timezone">
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    updateSetting("timezone", e.target.value)
                  }
                >
                  <option value="Asia/Kolkata">India (IST)</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="Europe/London">London</option>
                </select>
              </SettingsField>

              <SettingsField label="Default Currency">
                <select
                  value={settings.currency}
                  onChange={(e) =>
                    updateSetting("currency", e.target.value)
                  }
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </SettingsField>
            </div>
          </>
        );

      case "members":
        return (
          <>
            <SectionHeading
              title="Team Members"
              description="Manage the people who have access to your organization."
              action={
                <button
                  type="button"
                  className="settings-primary-button"
                  onClick={() => setShowAddMember(true)}
                >
                  <Plus size={15} />
                  Add Member
                </button>
              }
            />

            <div className="settings-member-summary">
              <div>
                <span>Total Members</span>
                <strong>{members.length}</strong>
              </div>
              <div>
                <span>Managers</span>
                <strong>
                  {members.filter((m) => m.role === "Manager").length}
                </strong>
              </div>
              <div>
                <span>Members</span>
                <strong>
                  {members.filter((m) => m.role === "Member").length}
                </strong>
              </div>
            </div>

            <div className="settings-member-toolbar">
              <div className="settings-member-search">
                <Search size={16} />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder="Search members..."
                />
              </div>
              <span>{filteredMembers.length} results</span>
            </div>

            <div className="settings-member-table-wrap">
              <table className="settings-member-table">
                <thead>
                  <tr>
                    <th>MEMBER</th>
                    <th>ROLE</th>
                    <th>JOINED</th>
                    <th className="settings-member-actions-heading">
                      ACTION
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member.id}>
                      <td>
                        <div className="settings-member-identity">
                          <div className="settings-member-avatar">
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <strong>{member.name}</strong>
                            <span>{member.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`settings-role-badge ${member.role.toLowerCase()}`}
                        >
                          {member.role === "Admin" && (
                            <ShieldCheck size={12} />
                          )}
                          {member.role}
                        </span>
                      </td>

                      <td>
                        <span className="settings-joined-date">
                          <CalendarDays size={13} />
                          {member.joinedAt}
                        </span>
                      </td>

                      <td>
                        {member.role === "Admin" ? (
                          <span className="settings-owner-label">
                            Workspace owner
                          </span>
                        ) : (
                          <select
                            className="settings-role-select"
                            value={member.role}
                            aria-label={`Change role for ${member.name}`}
                            onChange={(e) =>
                              updateMemberRole(member.id, e.target.value)
                            }
                          >
                            <option value="Manager">Manager</option>
                            <option value="Member">Member</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}

                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan="4">
                        <div className="settings-empty-state">
                          <Users size={25} />
                          <strong>No members found</strong>
                          <span>Try another name or email address.</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="settings-member-note">
              <ShieldCheck size={15} />
              Only organization admins can manage team members and roles.
            </div>
          </>
        );

      case "inventory":
        return (
          <>
            <SectionHeading
              title="Inventory Preferences"
              description="Configure default stock thresholds and inventory alerts."
            />

            <div className="settings-subsection-title">
              <h3>Stock Configuration</h3>
              <p>Default values used when adding new products.</p>
            </div>

            <div className="settings-form-grid settings-single-column">
              <SettingsField
                label="Default Reorder Level"
                hint="Used as the default threshold for new products. Existing product thresholds remain unchanged."
              >
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={settings.defaultReorderLevel}
                  onChange={(e) =>
                    updateSetting("defaultReorderLevel", e.target.value)
                  }
                />
              </SettingsField>
            </div>

            <div className="settings-subsection">
              <div className="settings-subsection-title">
                <h3>Inventory Alerts</h3>
                <p>Choose which inventory events should trigger alerts.</p>
              </div>

              <SettingsToggle
                title="Low Stock Alerts"
                description="Notify when product stock reaches its reorder level."
                checked={settings.lowStockAlerts}
                onChange={(value) =>
                  updateSetting("lowStockAlerts", value)
                }
              />

              <SettingsToggle
                title="Out of Stock Alerts"
                description="Notify when a product has zero available stock."
                checked={settings.outOfStockAlerts}
                onChange={(value) =>
                  updateSetting("outOfStockAlerts", value)
                }
              />

              <SettingsToggle
                title="Purchase Order Updates"
                description="Receive updates when purchase orders change status."
                checked={settings.purchaseOrderAlerts}
                onChange={(value) =>
                  updateSetting("purchaseOrderAlerts", value)
                }
              />
            </div>
          </>
        );

      case "notifications":
        return (
          <>
            <SectionHeading
              title="Notifications"
              description="Control how EnterpriseOS communicates important updates."
            />

            <div className="settings-subsection-title">
              <h3>Delivery Channels</h3>
              <p>Choose where you want to receive notifications.</p>
            </div>

            <SettingsToggle
              title="Email Notifications"
              description="Receive important updates and alerts through email."
              checked={settings.emailNotifications}
              onChange={(value) =>
                updateSetting("emailNotifications", value)
              }
            />

            <SettingsToggle
              title="In-App Notifications"
              description="Show alerts and updates inside your dashboard."
              checked={settings.inAppNotifications}
              onChange={(value) =>
                updateSetting("inAppNotifications", value)
              }
            />

            <div className="settings-subsection">
              <div className="settings-subsection-title">
                <h3>Reports</h3>
                <p>Stay informed about your inventory performance.</p>
              </div>

              <SettingsToggle
                title="Weekly Inventory Reports"
                description="Receive a weekly summary of stock levels and inventory performance."
                checked={settings.weeklyReports}
                onChange={(value) =>
                  updateSetting("weeklyReports", value)
                }
              />
            </div>
          </>
        );

      case "appearance":
        return (
          <>
            <SectionHeading
              title="Appearance"
              description="Customize how your workspace looks and feels."
            />

            <div className="settings-subsection-title">
              <h3>Display Preferences</h3>
              <p>Choose your preferred dashboard appearance.</p>
            </div>

            <div className="settings-form-grid settings-single-column">
              <SettingsField
                label="Color Theme"
                hint="The selected preference is stored locally in this page for now. Application-wide theme switching will be connected later."
              >
                <select
                  value={settings.theme}
                  onChange={(e) =>
                    updateSetting("theme", e.target.value)
                  }
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System Default</option>
                </select>
              </SettingsField>
            </div>

            <div className="settings-subsection">
              <SettingsToggle
                title="Compact Sidebar"
                description="Use a more compact navigation layout."
                checked={settings.compactSidebar}
                onChange={(value) =>
                  updateSetting("compactSidebar", value)
                }
              />
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="dashboard-overview settings-page">
      <div className="overview-heading">
        <div>
          <h1>Settings</h1>
          <p>Manage your account, organization and workspace preferences.</p>
        </div>
        <span className="settings-demo-label">UI PREVIEW</span>
      </div>

      <div className="settings-layout">
        <aside className="settings-navigation">
          <p className="settings-nav-label">WORKSPACE SETTINGS</p>

          {settingsSections.map((section) => {
            const Icon = section.icon;

            return (
              <button
                key={section.id}
                type="button"
                className={`settings-nav-item ${
                  activeSection === section.id ? "active" : ""
                }`}
                onClick={() => {
                  setActiveSection(section.id);
                  setSaved(false);
                }}
              >
                <Icon size={17} />
                <span>{section.label}</span>
              </button>
            );
          })}

          <div className="settings-nav-footer">
            <ShieldCheck size={15} />
            <span>Workspace administration</span>
          </div>
        </aside>

        <div className="settings-content">
          {renderSection()}

          <div className="settings-footer">
            <span className="settings-save-message">
              {saved && (
                <>
                  <Check size={15} />
                  Changes saved in this session.
                </>
              )}
            </span>

            <button type="button" onClick={handleSave} className="settings-save-button">Save</button>
          </div>
        </div>
      </div>

      {showAddMember && (
        <div
          className="settings-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddMember(false);
            }
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
          >
            <div className="settings-modal-header">
              <div>
                <h2 id="add-member-title">Add Team Member</h2>
                <p>Add a new person to your organization.</p>
              </div>
              <button
                type="button"
                className="settings-modal-close"
                onClick={() => setShowAddMember(false)}
                aria-label="Close dialog"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={addMember}>
              <div className="settings-modal-fields">
                <SettingsField label="Full Name">
                  <input
                    autoFocus
                    required
                    value={memberForm.name}
                    onChange={(e) =>
                      setMemberForm((current) => ({
                        ...current,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Enter full name"
                  />
                </SettingsField>

                <SettingsField label="Email Address">
                  <input
                    required
                    type="email"
                    value={memberForm.email}
                    onChange={(e) =>
                      setMemberForm((current) => ({
                        ...current,
                        email: e.target.value,
                      }))
                    }
                    placeholder="name@company.com"
                  />
                </SettingsField>

                <SettingsField label="Role">
                  <select
                    value={memberForm.role}
                    onChange={(e) =>
                      setMemberForm((current) => ({
                        ...current,
                        role: e.target.value,
                      }))
                    }
                  >
                    <option value="Member">Member</option>
                    <option value="Manager">Manager</option>
                  </select>
                </SettingsField>
              </div>

              <div className="settings-modal-note">
                <Mail size={14} />
                Demo only: no invitation email will be sent yet.
              </div>

              <div className="settings-modal-footer">
                <button
                  type="button"
                  className="settings-cancel-button"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="settings-primary-button">
                  <Plus size={15} />
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
