export const getComputerUID = (): string => {
  let uid = localStorage.getItem('computer_uid');
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem('computer_uid', uid);
  }
  return uid;
};
