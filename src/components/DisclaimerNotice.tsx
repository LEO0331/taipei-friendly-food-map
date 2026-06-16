type Props = {
  children: string;
};

export function DisclaimerNotice({ children }: Props) {
  return <p className="notice">{children}</p>;
}
