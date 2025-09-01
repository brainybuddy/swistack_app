interface HelloWorldProps {
  name?: string;
}
export default function HelloWorld({ name = 'World' }: HelloWorldProps) {
  return (
    <div className="p-4 text-center">
      <h1 className="text-2xl font-bold text-gray-900">
        Hello, {name}!
      </h1>
    </div>
  );
}