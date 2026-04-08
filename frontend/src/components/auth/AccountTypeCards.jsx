import { HiBadgeCheck, HiOfficeBuilding, HiShieldCheck, HiUser } from 'react-icons/hi';
import Card from '../common/Card';

const ACCOUNT_TYPES = [
  {
    value: 'client',
    label: 'User',
    loginDescription: 'Access SOS alerts and emergency services.',
    registerDescription: 'Create a user profile for SOS and emergencies.',
    icon: HiUser,
  },
  {
    value: 'doctor',
    label: 'Doctor',
    loginDescription: 'Manage profile, schedule, and availability.',
    registerDescription: 'Set up your doctor profile and credentials.',
    icon: HiBadgeCheck,
  },
  {
    value: 'hospital',
    label: 'Hospital Admin',
    loginDescription: 'Update beds, ICU, ventilators, and resources.',
    registerDescription: 'Set up hospital operations and bed inventory.',
    icon: HiOfficeBuilding,
  },
  {
    value: 'admin',
    label: 'Super Admin',
    loginDescription: 'Monitor the platform and system activity.',
    registerDescription: 'Create an admin account for oversight.',
    icon: HiShieldCheck,
  },
];

const AccountTypeCards = ({ value, onChange, intent = 'login' }) => {
  const actionLabel = intent === 'register' ? 'Register as' : 'Login as';
  const getDescription = (type) =>
    intent === 'register' ? type.registerDescription : type.loginDescription;

  return (
    <div className="grid sm:grid-cols-2 gap-3">
      {ACCOUNT_TYPES.map((type) => {
        const Icon = type.icon;
        const isActive = value === type.value;

        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className="text-left"
          >
            <Card
              hover
              className={`border ${
                isActive
                  ? 'border-primary/60 bg-primary/5 shadow-lg shadow-primary/10'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-900/10 dark:bg-white/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-900 dark:text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {actionLabel} {type.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {getDescription(type)}
                  </p>
                </div>
              </div>
            </Card>
          </button>
        );
      })}
    </div>
  );
};

export default AccountTypeCards;
