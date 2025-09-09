import Link from 'next/link';
export default function Courses(){return (<div className='min-h-screen bg-gray-50'>
<nav className='bg-white border-b'><div className='max-w-6xl mx-auto h-16 flex items-center px-4'><Link href='/' className='font-bold text-blue-600'>EduPlatform</Link></div></nav>
<div className='max-w-6xl mx-auto p-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
  <div className='bg-white p-5 rounded border'><h3 className='font-semibold'>Web Development Bootcamp</h3><p className='text-sm text-gray-300'>Sarah Johnson</p><div className='flex justify-between mt-3'><span className='font-bold text-blue-600'>$89</span><a href='#' className='bg-blue-600 text-white px-3 py-1 rounded'>View</a></div></div>
  <div className='bg-white p-5 rounded border'><h3 className='font-semibold'>Data Science with Python</h3><p className='text-sm text-gray-300'>Michael Chen</p><div className='flex justify-between mt-3'><span className='font-bold text-blue-600'>$99</span><a href='#' className='bg-blue-600 text-white px-3 py-1 rounded'>View</a></div></div>
  <div className='bg-white p-5 rounded border'><h3 className='font-semibold'>UI/UX Design Fundamentals</h3><p className='text-sm text-gray-300'>Emily Carter</p><div className='flex justify-between mt-3'><span className='font-bold text-blue-600'>$79</span><a href='#' className='bg-blue-600 text-white px-3 py-1 rounded'>View</a></div></div>
</div>
</div>)}
