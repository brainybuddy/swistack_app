import Link from 'next/link';
export default function Dashboard(){return (<div className='min-h-screen bg-gray-50'>
<nav className='bg-white border-b'><div className='max-w-6xl mx-auto h-16 flex items-center justify-between px-4'><Link href='/' className='font-bold text-blue-600'>EduPlatform</Link><div className='flex items-center space-x-2'><div className='w-8 h-8 bg-blue-600 rounded-full text-white flex items-center justify-center text-sm'>JD</div><span>John Doe</span></div></div></nav>
<div className='max-w-6xl mx-auto p-6'>
  <h1 className='text-2xl font-bold mb-2'>Welcome back, John!</h1><p className='text-gray-600 mb-6'>Continue your learning journey</p>
  <div className='grid grid-cols-2 md:grid-cols-4 gap-6 mb-6'>
    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold text-blue-600'>3</div><div>Enrolled</div></div>
    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold text-green-600'>1</div><div>Completed</div></div>
    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold'>127</div><div>Hours</div></div>
    <div className='bg-white p-6 rounded border'><div className='text-xl font-bold'>12</div><div>Streak</div></div>
  </div>
  <div className='bg-white p-6 rounded border'><h2 className='font-semibold mb-2'>Continue Learning</h2><div className='flex items-center justify-between p-4 bg-gray-50 rounded'><div><div className='font-semibold'>Web Development Bootcamp</div><div className='text-sm text-gray-300'>75% complete</div></div><button className='bg-blue-600 text-white px-4 py-2 rounded'>Continue</button></div></div>
</div>
</div>)}
