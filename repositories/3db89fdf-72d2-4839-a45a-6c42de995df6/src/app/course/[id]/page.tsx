import Link from 'next/link';
export default function Course(){return (<div className='min-h-screen bg-gray-50'>
<nav className='bg-white border-b'><div className='max-w-6xl mx-auto h-16 flex items-center px-4'><Link href='/' className='font-bold text-blue-600'>EduPlatform</Link></div></nav>
<div className='max-w-3xl mx-auto p-6'>
  <div className='bg-white p-6 rounded border mb-6'><h1 className='text-2xl font-bold mb-2'>Course Title</h1><p className='text-gray-600 mb-4'>By Instructor Name</p><p className='mb-4'>This is a static course detail page for the template.</p><button className='bg-blue-600 text-white px-4 py-2 rounded'>Enroll Now</button></div>
  <div className='grid sm:grid-cols-2 gap-6'>
    <div className='bg-white p-6 rounded border'><h2 className='font-semibold mb-2'>What you'll learn</h2><ul className='list-disc pl-6 text-sm text-gray-700 space-y-1'><li>Topic A</li><li>Topic B</li><li>Topic C</li></ul></div>
    <div className='bg-white p-6 rounded border'><h2 className='font-semibold mb-2'>Curriculum</h2><ol className='list-decimal pl-6 text-sm text-gray-700 space-y-1'><li>Module 1</li><li>Module 2</li><li>Module 3</li></ol></div>
  </div>
</div>
</div>)}
