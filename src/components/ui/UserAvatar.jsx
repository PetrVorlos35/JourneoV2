import React from 'react';
import { Mountain, Palmtree, Compass, Map, Plane, Camera } from 'lucide-react';

const avatarPresets = {
  mountain: Mountain,
  beach: Palmtree,
  city: Compass,
  forest: Map,
  travel: Plane,
  photography: Camera,
};

const UserAvatar = ({ user, size = "md", className = "" }) => {
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
    }
    if (user?.first_name) return user.first_name[0].toUpperCase();
    if (user?.email) return user.email.substring(0, 2).toUpperCase();
    return '??';
  };

  const sizeClasses = {
    sm: "w-8 h-8 text-[11px]",
    md: "w-10 h-10 text-xs",
    lg: "w-14 h-14 text-base",
    xl: "w-20 h-20 text-xl"
  };

  const iconSizes = {
    sm: 14,
    md: 18,
    lg: 24,
    xl: 32
  };

  const baseClasses = `rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-600/30 flex items-center justify-center shrink-0 ${className}`;

  if (user?.avatar_url && avatarPresets[user.avatar_url]) {
    const Icon = avatarPresets[user.avatar_url];
    return (
      <div className={`${sizeClasses[size] || sizeClasses.md} ${baseClasses}`}>
        <Icon size={iconSizes[size] || iconSizes.md} strokeWidth={2.5} />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size] || sizeClasses.md} ${baseClasses} font-bold`}>
      {getInitials()}
    </div>
  );
};

export default UserAvatar;
